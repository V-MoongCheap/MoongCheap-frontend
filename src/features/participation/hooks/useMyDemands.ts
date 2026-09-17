'use client';

import { useInfiniteQuery } from '@tanstack/react-query';

import { PARTICIPATION_TAB_ALL, type ParticipationTab } from '@/constants/participationStatus';
import { ApiError } from '@/lib/api';
import { fetchMyDemands } from '@/lib/demandApi';
import type { DemandStatusDto } from '@/types/api/demand';

// 내 수요 참여 목록 조회 캐시(B-17, FN-B17-01). 주문 목록(`features/order/hooks/useOrders.ts`)과
// 같은 방침이다 — 탭마다 캐시 키가 달라 탭을 오가도 신선도 시간(전역 60초, `app/providers.tsx`)
// 안에서는 다시 받지 않는다. 조회가 클라이언트인 이유는 `lib/demandApi.ts` 주석 참고.

export const DEMAND_QUERY_KEYS = {
  list: (tab: ParticipationTab) => ['demands', 'list', tab] as const,
};

/**
 * 화면 탭 → 백엔드 상태(`statuses` 복수 파라미터) 매핑.
 *
 * - 전체: 완료를 포함한 **진짜 전체**(2026-09-17 결정). 매핑된 5종을 모두 넣는다. 터미널 4종은 제외.
 *   백엔드는 `statuses` 미전달 시 완료를 빼므로, 전체 탭도 반드시 명시한다.
 * - 배정완료: 낙찰 후 자동결제 대기(`PAYMENT_PENDING`)를 함께 넣는다(2026-09-17 결정).
 * - 완료: `CLOSED` 명시 필수(미전달 시 진행중만 와서 빈다).
 */
const STATUSES_BY_TAB: Record<ParticipationTab, readonly DemandStatusDto[]> = {
  [PARTICIPATION_TAB_ALL]: [
    'UNASSIGNED',
    'SUBSTITUTE_OFFERED',
    'ASSIGNED',
    'PAYMENT_PENDING',
    'CLOSED',
  ],
  GATHERING: ['UNASSIGNED'],
  ALLOCATED: ['ASSIGNED', 'PAYMENT_PENDING'],
  ACTION_REQUIRED: ['SUBSTITUTE_OFFERED'],
  DONE: ['CLOSED'],
};

/**
 * 재시도 판단. 서버가 거절한 4xx(미로그인 401 등)는 다시 보내도 같아 재시도하지 않는다.
 * 네트워크 끊김(0)과 5xx만 한 번 더 보낸다(`useOrders`와 동일).
 */
function shouldRetry(failureCount: number, error: Error): boolean {
  const rejected = error instanceof ApiError && error.status >= 400 && error.status < 500;
  return !rejected && failureCount < 1;
}

/** 참여 목록. 20건씩 이어 붙인다(`BR-B17-01-11`). 페이지 번호는 0부터다. */
export function useMyDemands(tab: ParticipationTab) {
  return useInfiniteQuery({
    queryKey: DEMAND_QUERY_KEYS.list(tab),
    queryFn: ({ pageParam }) => fetchMyDemands(STATUSES_BY_TAB[tab], pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    retry: shouldRetry,
  });
}
