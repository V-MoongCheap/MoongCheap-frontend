'use client';

import { useEffect, useRef } from 'react';

// 무한 스크롤 감지 공통 훅. 목록 끝에 둔 표식(sentinel)이 뷰포트에 가까워지면 다음 페이지를 받는다.
// 목록 조회 화면(주문 내역 B-21·참여 목록 B-17 등)이 공유한다.
//
// `canLoadMore`가 false면(마지막 페이지·로딩 중·이어 받기 실패) 관찰을 멈춰, 표식이 화면에 걸린 채
// 실패한 요청을 되풀이하지 않게 한다. 끝에 닿기 전에 미리 받도록 rootMargin을 200px 준다.

/**
 * @param canLoadMore 다음 페이지를 받아도 되는 상태인지(hasNextPage && !isFetchingNextPage && !error).
 * @param onLoadMore  다음 페이지 요청. **참조가 안정적**이어야 한다(react-query `fetchNextPage`는 안정적).
 *                    반환값(Promise 등)은 무시한다.
 * @returns 목록 끝의 표식 요소에 붙일 ref.
 */
export function useInfiniteScrollSentinel(canLoadMore: boolean, onLoadMore: () => unknown) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (node === null || !canLoadMore) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void onLoadMore();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [canLoadMore, onLoadMore]);

  return sentinelRef;
}
