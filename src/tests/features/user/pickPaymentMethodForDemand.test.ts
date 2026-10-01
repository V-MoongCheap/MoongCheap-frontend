import { describe, expect, it } from 'vitest';

import { pickPaymentMethodForDemand } from '@/features/user/hooks/usePaymentMethods';
import type { PaymentMethod } from '@/types/payment';

function method(id: number, overrides: Partial<PaymentMethod> = {}): PaymentMethod {
  return {
    id,
    name: '신한카드',
    maskedNumber: null,
    isDefault: false,
    isSelectable: true,
    ...overrides,
  };
}

describe('pickPaymentMethodForDemand', () => {
  it('고를 수 있는 기본 결제수단을 우선한다', () => {
    const methods = [method(1), method(2, { isDefault: true })];

    expect(pickPaymentMethodForDemand(methods)?.id).toBe(2);
  });

  it('기본이 비활성(INACTIVE)이면 건너뛰고 고를 수 있는 첫 건을 쓴다', () => {
    const methods = [method(1, { isDefault: true, isSelectable: false }), method(2), method(3)];

    expect(pickPaymentMethodForDemand(methods)?.id).toBe(2);
  });

  it('고를 수 있는 결제수단이 없으면 null이다(화면은 제출을 잠근다)', () => {
    expect(pickPaymentMethodForDemand([method(1, { isSelectable: false })])).toBeNull();
    expect(pickPaymentMethodForDemand([])).toBeNull();
  });
});
