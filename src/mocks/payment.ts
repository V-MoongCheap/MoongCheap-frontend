import type { PaymentMethod } from '@/types/payment';

/**
 * 결제수단 목 데이터.
 *
 * `mocks/auth.ts`와 같은 규칙이다. 실제 연동(토스 브랜드페이 SDK) 시 이 함수의 **본문만**
 * 목록 조회로 교체하고 반환 타입은 그대로 둔다.
 *
 * 값은 시안(B-14)에 적힌 예시를 그대로 옮겼다. **빈 목록 상태**(등록 카드 0건)를 확인하려면
 * 아래 배열을 비우면 된다. 기본결제수단은 첫 항목(isDefault: true) 하나뿐이다.
 */

const mockPaymentMethods: PaymentMethod[] = [
  { id: 'pm-1', name: '카드의정석 SHOPPING+', bin: '6131', last4: '9000', isDefault: true },
  { id: 'pm-2', name: '신한카드 SOL Plan+', bin: '3310', last4: '6642', isDefault: false },
  { id: 'pm-3', name: '신한카드 SOL Plan', bin: '3011', last4: '5473', isDefault: false },
];

export async function mockGetPaymentMethods(): Promise<PaymentMethod[]> {
  return mockPaymentMethods;
}
