import { describe, expect, it } from 'vitest';

import { ORDER_PROGRESS_TABS, toOrderListTabKey } from '@/constants/orderStatus';

describe('toOrderListTabKey', () => {
  it.each(['all', 'inProgress', 'delivered', 'confirmed'] as const)(
    '알려진 탭(%s)은 그대로 쓴다',
    (tab) => {
      expect(toOrderListTabKey(tab)).toBe(tab);
    },
  );

  it.each([null, '', 'canceled', 'INPROGRESS'])('없거나 모르는 값(%s)은 전체 탭이다', (value) => {
    expect(toOrderListTabKey(value)).toBe('all');
  });
});

describe('ORDER_PROGRESS_TABS', () => {
  it('마이페이지 진행 단계는 배송완료만 배송완료 탭, 나머지는 진행중 탭으로 연다', () => {
    expect(ORDER_PROGRESS_TABS).toEqual({
      PAYMENT_COMPLETED: 'inProgress',
      DELIVERY_REQUESTED: 'inProgress',
      PREPARING: 'inProgress',
      SHIPPING: 'inProgress',
      DELIVERED: 'delivered',
    });
  });
});
