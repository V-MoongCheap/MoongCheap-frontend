'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';

import { useRouter } from 'next/navigation';

import { CircleXIcon, SearchIcon } from '@/components/ui/Icons';
import { SEARCH_QUERY_MAX_LENGTH, SEARCH_QUERY_MIN_LENGTH } from '@/constants/businessRules';
import {
  SEARCH_CLEAR_LABEL,
  SEARCH_INPUT_LABEL,
  SEARCH_PLACEHOLDER,
} from '@/constants/searchMessages';
import { RecentSearches } from '@/features/search/components/RecentSearches';
import { useRecentSearches } from '@/features/search/hooks/useRecentSearches';

// B-05 검색 입력 본문. 시안 `1153:72646`(기본) · `1153:72713`(타이핑 중).
//
// 두 시안의 차이는 OS 키보드가 올라온 것뿐이다. 최근 검색어 목록은 타이핑 중에도 그대로 남고
// 하단 GNB도 계속 있다(키보드가 덮을 뿐이다). 그래서 포커스 상태로 분기할 것이 없다.
//
// 검색 실행 조건은 BR-B05-01-01이다 - 공백을 제외하고 SEARCH_QUERY_MIN_LENGTH자 이상.
// ⚠️ 미달 상태의 시안이 없다. 새 오류 문구를 지어내지 않고 실행만 막되, 버튼이 왜 안 먹는지
//    보조기술에는 전달되도록 aria-disabled를 붙인다. 문구가 정해지면 여기에 안내를 얹는다.
//
// 지우기(×)는 시안 B-05에는 없고 명세 FN-B05-01에 있다(1자 이상이면 노출, 누르면 전체 삭제 후
// 플레이스홀더 복귀, #172). 모양은 같은 검색어 칸인 B-06 검색줄(`SearchQueryBar`)의 ×를 따른다.

interface SearchViewProps {
  /** 검색 결과 화면 경로. 라우트는 호출부(page)가 정한다. */
  resultsHref: string;
  /** 결과 화면에서 편집하러 돌아왔을 때 채워 둘 검색어. 홈에서 들어오면 빈 문자열이다. */
  initialQuery?: string;
}

export function SearchView({ resultsHref, initialQuery = '' }: SearchViewProps) {
  const router = useRouter();
  const { keywords, add, remove, clear } = useRecentSearches();
  const [query, setQuery] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  // 검색 실행은 `router.push`라 `Link`처럼 결과 경로를 미리 받아 두지 않는다. 그러면 결과 화면의
  // 로딩 화면(`search/results/loading.tsx`)을 모르는 채로 이동해, 서버 응답이 늦을 때 바깥쪽
  // 로딩 화면(`search/loading.tsx`, 검색 입력 모양)이 결과 주소에 잠깐 뜬다(#167). 들어오자마자
  // 결과 경로를 미리 받아 두어 결과 모양의 로딩 화면이 바로 뜨게 한다.
  useEffect(() => {
    router.prefetch(resultsHref);
  }, [router, resultsHref]);

  const canSubmit = query.trim().length >= SEARCH_QUERY_MIN_LENGTH;

  function run(keyword: string) {
    const trimmed = keyword.trim();
    if (trimmed.length < SEARCH_QUERY_MIN_LENGTH) {
      return;
    }
    add(trimmed);
    router.push(`${resultsHref}?q=${encodeURIComponent(trimmed)}`);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    run(query);
  }

  // 지우고 나서 바로 다시 입력할 수 있게 입력칸에 포커스를 돌려준다.
  function handleClear() {
    setQuery('');
    inputRef.current?.focus();
  }

  return (
    <div className="flex w-full flex-1 flex-col">
      {/* 시안 `818:9606` - 40 높이 알약 입력창 하나. 시안은 폭을 361로 고정했는데 좌우 여백이
          16씩이라 px-4 + 전체폭으로 옮겼다(다른 폭에서도 같은 여백이 유지된다). */}
      <form className="flex w-full items-center px-4 py-3" onSubmit={handleSubmit} role="search">
        <div className="bg-surface-secondary rounded-round flex h-10 w-full items-center gap-2 px-4 py-0.5">
          <input
            aria-label={SEARCH_INPUT_LABEL}
            autoComplete="off"
            className="text-section-title-16 text-content-primary placeholder:text-content-disabled-secondary min-w-0 flex-1 bg-transparent outline-none"
            enterKeyHint="search"
            maxLength={SEARCH_QUERY_MAX_LENGTH}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={SEARCH_PLACEHOLDER}
            ref={inputRef}
            // type="search"는 브라우저가 자체 지우기 X를 덧붙여 아래 ×와 겹친다. text로 두고,
            // 모바일 키보드의 확인 키만 enterKeyHint로 '검색'으로 바꾼다.
            type="text"
            value={query}
          />
          {query.length > 0 && (
            <button
              aria-label={SEARCH_CLEAR_LABEL}
              className="text-content-quinary flex size-6 shrink-0 items-center justify-center"
              onClick={handleClear}
              type="button"
            >
              <CircleXIcon className="size-[18px]" />
            </button>
          )}
          <button
            aria-disabled={!canSubmit}
            aria-label={SEARCH_INPUT_LABEL}
            className="text-content-quarternary flex h-10 shrink-0 items-center px-1"
            type="submit"
          >
            <SearchIcon className="size-6" />
          </button>
        </div>
      </form>

      <RecentSearches keywords={keywords} onClear={clear} onRemove={remove} onSelect={run} />
    </div>
  );
}
