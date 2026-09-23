import type { PaymentMethodResponseDto } from '@/types/api/payment';
import type { PaymentMethod } from '@/types/payment';

import { apiFetch } from './api';

/**
 * 결제수단(B-14) 백엔드 호출.
 *
 * `lib/addressApi.ts`와 같은 규칙이다. 화면은 백엔드 DTO를 모르고 `types/payment.ts`의
 * `PaymentMethod`만 안다. 변환은 전부 이 파일이 맡는다.
 *
 * 인증은 SID httpOnly 쿠키다. `apiFetch`가 `credentials: 'include'`를 붙인다.
 *
 * 결제수단 **등록**(토스 브랜드페이 SDK)은 2026-09-23 범위 조정으로 이번 MVP에서 뺐다. 등록은
 * Swagger로 대신하고, 프론트는 조회와 기본 변경만 붙인다. 삭제(FN-B14-04)도 명세상 Full이라 두지 않는다.
 */

function toPaymentMethod(dto: PaymentMethodResponseDto): PaymentMethod {
  return {
    id: dto.id,
    name: dto.provider,
    // 빈 문자열도 번호가 없는 것으로 본다. 카드가 빈 줄을 그리지 않게 한다.
    maskedNumber: dto.number === null || dto.number === '' ? null : dto.number,
    isDefault: dto.isDefault,
    isSelectable: dto.status === 'ACTIVE',
  };
}

/**
 * 결제수단 목록. 삭제된 것(`EXPIRED`)은 백엔드가 뺀다. 정렬도 백엔드가 한다
 * (기본 결제수단 먼저, 나머지는 등록순). 프론트에서 다시 정렬하지 않는다.
 *
 * `GET /api/payments/methods`
 */
export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  const response = await apiFetch('/api/payments/methods');
  const data = (await response.json()) as PaymentMethodResponseDto[];
  return data.map(toPaymentMethod);
}

/**
 * 기본 결제수단 지정. `ACTIVE`인 본인 결제수단만 된다. 아니면 404 `PAY_001`.
 * 이미 기본인 것을 다시 지정해도 성공이다. 응답은 204에 본문이 없다.
 *
 * `PATCH /api/payments/methods/{id}/default`
 */
export async function setDefaultPaymentMethod(id: number): Promise<void> {
  await apiFetch(`/api/payments/methods/${encodeURIComponent(String(id))}/default`, {
    method: 'PATCH',
  });
}
