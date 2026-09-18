import { ApiError } from './api';

/**
 * TanStack Query 공통 재시도 판단.
 *
 * 서버가 거절한 4xx(미로그인 401·없는 리소스 404 등)는 다시 보내도 결과가 같아 재시도하지 않는다.
 * 네트워크 끊김(status 0)과 5xx만 한 번 더 보낸다. 목록·상세 조회 훅이 공유한다
 * (`useOrders`·`useMyDemands`).
 */
export function shouldRetryQuery(failureCount: number, error: Error): boolean {
  const rejected = error instanceof ApiError && error.status >= 400 && error.status < 500;
  return !rejected && failureCount < 1;
}
