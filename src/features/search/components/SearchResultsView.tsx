'use client';

import { useCallback, useEffect, useState } from 'react';

import { ERROR_ACTION_CLASS, ErrorScreen } from '@/components/ui/ErrorScreen';
import { ERROR_SCREEN_RETRY_LABEL } from '@/constants/commonMessages';
import { SEARCH_ERROR_DESCRIPTION } from '@/constants/searchMessages';
import { useCatalogDemandSummaries } from '@/features/product/hooks/useCatalogDemandBoards';
import { SearchEmptyState } from '@/features/search/components/SearchEmptyState';
import { SearchFilterTabs } from '@/features/search/components/SearchFilterTabs';
import { SearchResultCard } from '@/features/search/components/SearchResultCard';
import { ApiError } from '@/lib/api';
import { searchProducts } from '@/lib/productSearchApi';
import { mockSearchProducts } from '@/mocks/search';
import type { ProductSearchResult, SearchFilterKey } from '@/types/search';

// B-06 검색 결과 본문. 시안 `1153:72821`(전체) · `1153:72803`(모집중) · `1153:72812`(마감 임박).
//
// 조회가 클라이언트인 이유: `/api/products-search/search`는 permitAll이 아니라 세션(SID)이 필요한데
// SID는 httpOnly 쿠키라 브라우저만 갖고 있다. 서버 컴포넌트에서 부르면 쿠키 없이 나가 401이 된다
// ([[lib/productSearchApi]]).
//
// 조회에 실패하면(미로그인 · 미배선 · 색인 없음) 목으로 떨어진다. `ProductDetailView`와 같은 방침이다.
// 검색이 아예 안 되는 것과 결과가 0건인 것은 화면이 달라야 해서, 목 대체는 '실패'로 세지 않는다.
//
// 검색 응답에 수요보드 정보가 없어, 카드의 수요 값(마감·상태·건수·인원·희망가)은 카드마다
// 수요보드 조회로 채운다(`useCatalogDemandSummaries`, #173). 필터도 그 값으로 거른다.

/** 검색 응답을 화면 타입으로 옮긴다. 수요 관련 값은 응답에 없어 비워 두고 수요보드 조회로 채운다. */
function toResults(products: Awaited<ReturnType<typeof searchProducts>>['products']) {
  return products.map<ProductSearchResult>((item) => ({
    id: String(item.id),
    name: item.name,
    spec: item.specSummary ?? undefined,
    thumbnailUrl: item.thumbnailUrl ?? undefined,
    listPrice: item.listPrice ?? undefined,
  }));
}

interface SearchResultsViewProps {
  query: string;
  /**
   * 상품 상세 경로의 앞부분. 카드 링크는 여기에 `/{id}`를 붙인다. 라우트는 호출부(page)가 정한다.
   *
   * 경로를 만드는 **함수**로 받으면 안 된다. 호출부가 서버 컴포넌트라 함수는 클라이언트 경계를
   * 넘지 못한다("Functions cannot be passed directly to Client Components").
   */
  productHrefBase: string;
}

export function SearchResultsView({ query, productHrefBase }: SearchResultsViewProps) {
  // 결과에 그 결과가 어떤 검색어의 것인지를 함께 담는다. 검색어가 바뀐 직후 이전 목록이 잠깐
  // 남는 것을 막으면서도, effect 본문에서 동기 setState를 하지 않게 된다.
  const [loaded, setLoaded] = useState<{
    query: string;
    results: readonly ProductSearchResult[];
  } | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [filter, setFilter] = useState<SearchFilterKey>('all');
  // 재시도 때마다 값을 바꿔 조회 effect를 다시 돌린다.
  const [attempt, setAttempt] = useState(0);
  // 지금 검색어의 결과에만 수요 요약을 붙인다. 검색어가 바뀐 직후 남은 이전 결과로는 부르지 않는다.
  const currentResults = loaded !== null && loaded.query === query ? loaded.results : null;
  const demand = useCatalogDemandSummaries(currentResults?.map((item) => item.id) ?? []);

  useEffect(() => {
    let active = true;

    async function load() {
      let results: readonly ProductSearchResult[];
      try {
        const response = await searchProducts(query);
        results = toResults(response.products);
      } catch (cause) {
        // 실패를 두 종류로 가른다.
        //
        //   목으로 채울 실패  미배선·네트워크 끊김(status 0)·미로그인(401). 개발 중에는 늘 나는
        //                     상황이라 화면을 막으면 검수가 안 된다.
        //   알려야 할 실패    그 밖(4xx·5xx). 서버가 응답은 했는데 거절·실패한 것이라 사용자가
        //                     알아야 하고, 다시 시도할 수 있어야 한다.
        //
        // 가르지 않고 전부 목으로 삼키면 아래 ErrorScreen 분기에 닿을 길이 없어진다(팀원 리뷰).
        //
        // 목에 검색어를 그대로 넘겨 실제 검색처럼 걸러지게 한다. 안 그러면 어떤 검색어를 넣어도
        // 같은 상품 5장이 나와, 조회가 실패했다는 사실이 화면에서 드러나지 않는다.
        const recoverable =
          cause instanceof ApiError && (cause.status === 0 || cause.status === 401);
        if (!recoverable) {
          throw cause;
        }
        results = await mockSearchProducts(query);
      }
      if (active) {
        setLoaded({ query, results });
      }
    }

    load().catch((cause: unknown) => {
      if (!active) return;
      setError(cause instanceof Error ? cause : new Error('검색에 실패했습니다.'));
    });

    return () => {
      active = false;
    };
  }, [query, attempt]);

  const retry = useCallback(() => {
    setError(null);
    setLoaded(null);
    setAttempt((prev) => prev + 1);
  }, []);

  if (error !== null) {
    return (
      <ErrorScreen description={SEARCH_ERROR_DESCRIPTION}>
        <button className={ERROR_ACTION_CLASS} onClick={retry} type="button">
          {ERROR_SCREEN_RETRY_LABEL}
        </button>
      </ErrorScreen>
    );
  }

  // 첫 조회 중에는 필터도 목록도 그리지 않는다. 개수를 알기 전에 필터를 그리면 칩을 누를 수 있는데
  // 거를 대상이 없다.
  if (currentResults === null) {
    return null;
  }

  // 수요 요약을 카드 값에 얹는다. 조회 전·실패면 검색 응답 값 그대로 둔다(목 결과는 목 값 그대로).
  const results = currentResults.map((item) => {
    const summary = demand.summaries.get(item.id);
    return summary === undefined || summary === null ? item : { ...item, ...summary };
  });

  // 필터를 그릴 수 있는지. 수요가 있는 카드가 하나도 없으면(수요보드 조회 전·실패 포함) 칩을
  // 감춘다. 그 상태로 칩을 그리면 '모집중'을 눌렀을 때 결과가 통째로 사라지고 '찾는 상품이 없어요'가
  // 뜬다. 검색은 성공했는데 검색어를 바꾸라고 안내하는 셈이다.
  //
  // 검색이 0건일 때도 감춘다. 빈 상태 시안(`1153:72790`)에 칩이 없고, 거를 대상도 없다.
  const canFilter = results.some((item) => item.demandStatus !== undefined);

  // 칩을 감춘 상태에서는 이전에 고른 필터가 남아 있어도 무시한다(재조회로 값이 사라진 경우).
  const visible =
    !canFilter || filter === 'all'
      ? results
      : results.filter((item) => item.demandStatus === filter);

  return (
    <div className="flex w-full flex-1 flex-col">
      {canFilter && <SearchFilterTabs onChange={setFilter} value={filter} />}

      {visible.length === 0 ? (
        <SearchEmptyState />
      ) : (
        // 시안: 좌우 여백 16, 카드 사이 20.
        <ul className="flex w-full flex-col gap-5 p-4">
          {visible.map((product) => (
            <SearchResultCard
              demandLoadState={
                demand.pendingIds.has(product.id)
                  ? 'loading'
                  : demand.failedIds.has(product.id)
                    ? 'failed'
                    : undefined
              }
              href={`${productHrefBase}/${encodeURIComponent(product.id)}`}
              key={product.id}
              product={product}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
