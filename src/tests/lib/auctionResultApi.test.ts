import { describe, expect, it } from 'vitest';

import { toAwardResult } from '@/lib/auctionResultApi';
import type { AuctionResultDto } from '@/types/api/auctionResult';

const DTO: AuctionResultDto = {
  demandStatus: 'PAYMENT_PENDING',
  catalogName: '락토핏 골드 50포',
  thumbnail_url: '/images/lactofit.png',
  unitPrice: 12_000,
  shippingFee: 3_000,
  sellerName: '뭉치상회',
  quantity: 2,
  participantCount: 15,
  totalParticipantQuantity: 30,
  paymentDeadlineAt: '2026-09-28T21:05:00',
  awardReason: null,
};

const NULL_FIELDS: AuctionResultDto = {
  ...DTO,
  thumbnail_url: null,
  unitPrice: null,
  shippingFee: null,
  sellerName: null,
  quantity: null,
  participantCount: null,
  totalParticipantQuantity: null,
  paymentDeadlineAt: null,
};

describe('toAwardResult', () => {
  it('결제 예정 금액 = 낙찰 단가 × 내 수량 + 배송비', () => {
    expect(toAwardResult(DTO, '2만원 이하').expectedPaymentPrice).toBe(27_000);
  });

  it('배송비가 없으면 0원으로 계산한다', () => {
    expect(toAwardResult({ ...DTO, shippingFee: null }, '').expectedPaymentPrice).toBe(24_000);
  });

  it('단가나 수량이 없으면 결제 예정 금액을 만들지 않는다', () => {
    expect(toAwardResult({ ...DTO, unitPrice: null }, '')).not.toHaveProperty(
      'expectedPaymentPrice',
    );
  });

  it('자동결제 시각을 수요 상세와 같은 표기로 바꾼다', () => {
    expect(toAwardResult(DTO, '').paymentDeadlineLabel).toBe('9월 28일 (월) 오후 9:05');
  });

  it('내 수요가 CLOSED일 때만 결제 완료로 본다', () => {
    expect(toAwardResult(DTO, '').isPaid).toBe(false);
    expect(toAwardResult({ ...DTO, demandStatus: 'CLOSED' }, '').isPaid).toBe(true);
  });

  it('응답에 없는 값은 키를 넣지 않아 화면이 그 줄을 숨긴다(mock으로 채우지 않음)', () => {
    expect(toAwardResult(NULL_FIELDS, '')).toEqual({
      isPaid: false,
      productName: '락토핏 골드 50포',
    });
  });
});
