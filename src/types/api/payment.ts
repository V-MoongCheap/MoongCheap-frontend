/**
 * 결제수단 백엔드 DTO.
 *
 * `types/payment.ts`(화면용 `PaymentMethod`)와 역할이 다르다. 여기는 **백엔드 응답을 그대로 옮긴 것**이고,
 * 화면용 타입으로의 변환은 `lib/paymentApi.ts`가 맡는다(`types/api/address.ts`와 같은 구조).
 *
 * 출처: 백엔드 develop `PaymentMethodResponseDto`, `docs/brandpay-frontend-integration-guide.md` 6.4·6.6
 * (2026-09-23, 백엔드 PR #43).
 */

/**
 * 결제수단 상태. 백엔드 enum에는 `EXPIRED`(삭제됨)도 있지만 목록 조회가 걸러서 내려주지 않는다.
 * `INACTIVE`는 목록에 오지만 기본·자동결제 수단으로 고를 수 없다(가이드 6.4).
 */
export type PaymentMethodStatusDto = 'ACTIVE' | 'INACTIVE';

/**
 * `GET /api/payments/methods` 응답 원소.
 *
 * 정렬은 백엔드가 한다. 기본 결제수단이 맨 앞, 나머지는 id 오름차순(등록순)이다.
 */
export interface PaymentMethodResponseDto {
  id: number;
  /** 카드사·은행 표시명. 백엔드가 기관 코드를 이름으로 바꿔 준다(예: '신한카드'). */
  provider: string;
  /**
   * 토스가 준 마스킹 번호. 형식이 고정돼 있지 않고 null일 수 있다. 원문 번호가 아니므로 가공 없이
   * 그대로 표시한다(가이드 6.4).
   */
  number: string | null;
  /** 기본 결제수단 여부. 회원당 최대 1건이 true다(백엔드 V21 unique index). */
  isDefault: boolean;
  status: PaymentMethodStatusDto;
}

/**
 * 결제수단 관련 비즈니스 에러 코드. 출처: 백엔드 `ErrorCode.java`.
 * 화면이 `ApiError.code`로 분기할 때 문자열을 직접 적지 않도록 모아 둔다.
 */
export const PAYMENT_ERROR_CODE = {
  /**
   * 404 유효한 결제 수단을 찾을 수 없습니다. 본인 소유가 아니거나, 삭제됐거나, ACTIVE가 아닌
   * 결제수단을 기본으로 지정하려 할 때 온다.
   */
  methodNotFound: 'PAY_001',
} as const;
