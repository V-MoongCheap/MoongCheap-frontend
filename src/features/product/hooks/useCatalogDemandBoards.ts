'use client';

import { skipToken, useQueries, useQuery } from '@tanstack/react-query';

import {
  fetchCatalogDemandBoards,
  toQuickDeals,
  toSearchDemandSummary,
} from '@/lib/demandBoardApi';
import { toCatalogId } from '@/lib/productApi';
import { shouldRetryQuery } from '@/lib/queryRetry';
import type { ProductQuickDeal } from '@/types/product';
import type { SearchDemandSummary } from '@/types/search';

/**
 * 상품 도감 기준 수요보드 조회(`GET /api/demand-boards/catalog/{catalogId}`).
 *
 * 세션(SID httpOnly 쿠키)이 필요해 client에서 부른다. 캐시는 응답 하나를 도감 id별로 두고,
 * 화면마다 필요한 모양은 `select`로 만든다. 검색 결과에서 상품 상세로 들어가면 같은 캐시를 다시 쓴다.
 */

/** 수요보드 캐시 키. 퀵 참여 후 무효화할 때도 이 키를 쓴다. */
export const DEMAND_BOARD_QUERY_KEYS = {
  catalog: (catalogId: number | null) => ['demandBoards', 'catalog', catalogId] as const,
};

export interface CatalogQuickDealsState {
  /** 조회 전·실패 시 null. 성공하면 배열(0건이면 빈 배열)이다. */
  deals: ProductQuickDeal[] | null;
  isLoading: boolean;
  isError: boolean;
}

/**
 * B-08 상품 상세 '진행중인 뭉치 퀵 참여' 카드 목록.
 *
 * `catalogId`가 null이면(홈 목 카드의 문자열 id 등 백엔드 id가 아닌 경우) 조회하지 않는다.
 */
export function useCatalogQuickDeals(catalogId: number | null): CatalogQuickDealsState {
  const { data, isLoading, isError } = useQuery({
    queryKey: DEMAND_BOARD_QUERY_KEYS.catalog(catalogId),
    queryFn: catalogId === null ? skipToken : () => fetchCatalogDemandBoards(catalogId),
    select: toQuickDeals,
    retry: shouldRetryQuery,
  });

  return { deals: data ?? null, isLoading, isError };
}

export interface CatalogDemandSummariesState {
  /** 도감 id별 수요 요약. 조회에 성공한 id만 들어 있고, 모이는 보드가 없으면 값이 null이다. */
  summaries: ReadonlyMap<string, SearchDemandSummary | null>;
  /** 아직 조회 중인 도감 id. */
  pendingIds: ReadonlySet<string>;
  /** 조회에 실패한 도감 id. 수요가 없는 것과 구분해야 해서 따로 둔다. */
  failedIds: ReadonlySet<string>;
}

/**
 * B-06 검색 결과 카드들의 수요 요약(#173). 카드마다 한 번씩 부른다(검색 응답에 수요 필드가 없다,
 * [[types/search]]). 숫자가 아닌 id(검색 실패 시 목 결과)는 부르지 않는다.
 *
 * 상품 상세의 퀵 참여 카드와 캐시 키가 같아서, 검색 결과에서 상품 상세로 들어가면 다시 부르지 않는다.
 */
export function useCatalogDemandSummaries(ids: readonly string[]): CatalogDemandSummariesState {
  const targets = ids.flatMap((id) => {
    const catalogId = toCatalogId(id);
    return catalogId === null ? [] : [{ id, catalogId }];
  });

  return useQueries({
    queries: targets.map(({ catalogId }) => ({
      queryKey: DEMAND_BOARD_QUERY_KEYS.catalog(catalogId),
      queryFn: () => fetchCatalogDemandBoards(catalogId),
      select: toSearchDemandSummary,
      retry: shouldRetryQuery,
    })),
    combine: (results) => {
      const summaries = new Map<string, SearchDemandSummary | null>();
      const pendingIds = new Set<string>();
      const failedIds = new Set<string>();
      results.forEach((result, index) => {
        const { id } = targets[index];
        if (result.isSuccess) {
          summaries.set(id, result.data);
        } else if (result.isError) {
          failedIds.add(id);
        } else {
          pendingIds.add(id);
        }
      });
      return { summaries, pendingIds, failedIds };
    },
  });
}
