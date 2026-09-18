import { ApiError } from '@/lib/api';

/**
 * 조회 재시도 판단.
 *
 * **다시 보내면 결과가 달라질 수 있는 것만** 재시도한다. 네트워크 끊김(status 0)과 5xx다.
 * 나머지는 한 번 더 보내도 같은 결과가 오므로 실패 화면을 바로 띄우는 편이 낫다.
 *
 *   4xx          서버가 거절한 것이다(미로그인 401 · 없는 리소스 404 등)
 *   ApiError 아님 2xx 응답을 파싱·매핑하다 깨진 것이다(`SyntaxError`·`TypeError`).
 *                본문이 그대로 다시 오므로 같은 자리에서 또 깨진다
 *
 * 허용 목록으로 판정하는 이유가 두 번째 줄이다. 조회 함수들이 `response.json()`과 DTO 매핑을
 * `apiFetch` 밖에서 하므로 `ApiError`가 아닌 예외가 올라올 수 있다. 차단 목록으로 짜면 그것이
 * 재시도 대상으로 새어 들어가 쓸모없는 요청 한 번과 지연(기본 1초)이 붙는다.
 *
 * 주문(`features/order/hooks/useOrders`)과 배송지(`features/user/hooks/useAddresses`)가 같은
 * 규칙을 쓴다. 규칙이 갈릴 이유가 없어 한 곳에 둔다. 전역 기본값은 `app/providers.tsx`에 있다.
 */
export function shouldRetryQuery(failureCount: number, error: Error): boolean {
  if (failureCount >= 1) {
    return false;
  }
  if (!(error instanceof ApiError)) {
    return false;
  }
  // 상한을 둔다. `status`는 범위 제한이 없는 number라 표준 밖의 코드(예: 999)도 들어올 수 있다.
  // 뜻을 모르는 코드는 재시도해도 결과를 기대할 수 없으므로 바로 실패로 보낸다.
  return error.status === 0 || (error.status >= 500 && error.status <= 599);
}
