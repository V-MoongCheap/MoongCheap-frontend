import { ApiError } from '@/lib/api';

/**
 * 조회 재시도 판단.
 *
 * 서버가 거절한 4xx(미로그인 401 · 없는 리소스 404 등)는 다시 보내도 결과가 같아서 재시도하지
 * 않는다. 네트워크 끊김(status 0)과 5xx만 전역 기본값처럼 한 번 더 보낸다.
 *
 * 주문(`features/order/hooks/useOrders`)과 배송지(`features/user/hooks/useAddresses`)가 같은
 * 규칙을 쓴다. 규칙이 갈릴 이유가 없어 한 곳에 둔다. 전역 기본값은 `app/providers.tsx`에 있다.
 */
export function shouldRetryQuery(failureCount: number, error: Error): boolean {
  const rejected = error instanceof ApiError && error.status >= 400 && error.status < 500;
  return !rejected && failureCount < 1;
}
