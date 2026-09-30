import { describe, expect, it } from 'vitest';

import { canTransitionDemandBoard, type DemandBoardStatus } from '@/constants/demandBoardStatus';
import { canTransitionOrder, type OrderStatus } from '@/constants/orderStatus';
import { canTransition } from '@/lib/statusTransition';

describe('canTransition', () => {
  const registry = {
    A: { label: 'A', tone: 'brand', isTerminal: false, next: ['B'] },
    B: { label: 'B', tone: 'success', isTerminal: true, next: [] },
  } as const;

  it('레지스트리의 next에 있는 전이만 허용한다', () => {
    expect(canTransition(registry, 'A', 'B')).toBe(true);
    expect(canTransition(registry, 'B', 'A')).toBe(false);
  });

  it('백엔드가 모르는 상태를 보내도 죽지 않고 전이 불가로 떨어진다', () => {
    const unknown = 'UNKNOWN' as keyof typeof registry;

    expect(canTransition(registry, unknown, 'A')).toBe(false);
  });
});

describe('canTransitionOrder', () => {
  it.each<[OrderStatus, OrderStatus]>([
    ['PAYMENT_PENDING', 'PAYMENT_COMPLETED'],
    ['PAYMENT_COMPLETED', 'DELIVERY_REQUESTED'],
    ['SHIPPING', 'DELIVERED'],
    ['DELIVERED', 'PURCHASE_CONFIRMED'],
    ['REFUND_PENDING', 'REFUNDED'],
  ])('정방향 %s → %s는 허용한다', (from, to) => {
    expect(canTransitionOrder(from, to)).toBe(true);
  });

  it('결제 전·결제완료 단계에서만 취소할 수 있다', () => {
    expect(canTransitionOrder('PAYMENT_PENDING', 'CANCELED')).toBe(true);
    expect(canTransitionOrder('PAYMENT_COMPLETED', 'CANCELED')).toBe(true);
    // 배송요청은 되돌아갈 수 없는 지점이다
    expect(canTransitionOrder('DELIVERY_REQUESTED', 'CANCELED')).toBe(false);
  });

  it('역방향·단계 건너뛰기는 막는다', () => {
    expect(canTransitionOrder('DELIVERED', 'SHIPPING')).toBe(false);
    expect(canTransitionOrder('PAYMENT_PENDING', 'SHIPPING')).toBe(false);
  });

  it('종료 상태에서는 어디로도 가지 않는다', () => {
    expect(canTransitionOrder('PURCHASE_CONFIRMED', 'CANCELED')).toBe(false);
    expect(canTransitionOrder('CANCELED', 'PAYMENT_PENDING')).toBe(false);
  });
});

describe('canTransitionDemandBoard', () => {
  it.each<[DemandBoardStatus, DemandBoardStatus, boolean]>([
    ['GB_GATHERING', 'GB_ACTION_REQUIRED', true],
    ['GB_ACTION_REQUIRED', 'GB_CLOSED', true],
    ['GB_ACTION_REQUIRED', 'GB_CANCELED', true],
    ['GB_GATHERING', 'GB_CLOSED', false],
    ['GB_CLOSED', 'GB_GATHERING', false],
  ])('%s → %s = %s', (from, to, expected) => {
    expect(canTransitionDemandBoard(from, to)).toBe(expected);
  });
});
