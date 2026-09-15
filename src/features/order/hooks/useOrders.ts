'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import type { OrderListTabKey } from '@/constants/orderStatus';
import { ApiError } from '@/lib/api';
import { getOrderDetail, getOrders } from '@/lib/orderApi';

// 주문 조회 캐시(B-21 · B-28). 세션(`features/auth/session.ts`)처럼 TanStack Query 키로 공유한다.
//
// 탭마다 키가 달라 탭을 오가도 이미 받은 목록은 신선도 시간(전역 60초, `app/providers.tsx`) 안에서
// 다시 받지 않는다. 목록에서 상세로 들어갔다 돌아와도 같다.

export const ORDER_QUERY_KEYS = {
  list: (tab: OrderListTabKey) => ['orders', 'list', tab] as const,
  detail: (orderNo: string) => ['orders', 'detail', orderNo] as const,
};

/**
 * 재시도 판단. 서버가 거절한 4xx(미로그인 401 · 없는 주문 404 등)는 다시 보내도 결과가 같아서
 * 재시도하지 않는다. 네트워크 끊김(0)과 5xx만 전역 기본값처럼 한 번 더 보낸다.
 */
function shouldRetry(failureCount: number, error: Error): boolean {
  const rejected = error instanceof ApiError && error.status >= 400 && error.status < 500;
  return !rejected && failureCount < 1;
}

/** 주문 목록. 20건씩 이어 붙인다(`BR-B21-01-11`). 페이지 번호는 0부터다. */
export function useOrderList(tab: OrderListTabKey) {
  return useInfiniteQuery({
    queryKey: ORDER_QUERY_KEYS.list(tab),
    queryFn: ({ pageParam }) => getOrders(tab, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    retry: shouldRetry,
  });
}

/** 주문 상세. */
export function useOrderDetail(orderNo: string) {
  return useQuery({
    queryKey: ORDER_QUERY_KEYS.detail(orderNo),
    queryFn: () => getOrderDetail(orderNo),
    retry: shouldRetry,
  });
}
