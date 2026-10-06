import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { computeDday, toDemandCreateRequest } from '@/lib/demandApi';
import type { DemandFormValues } from '@/types/demandForm';

const IDS = { catalogId: 7, payMethodId: 1 };

const FORM: DemandFormValues = {
  quantity: 2,
  addressId: '3',
  priceBand: 'upto_20k',
  substituteAgreed: true,
  substituteNote: '  같은 용량이면 브랜드 무관  ',
  consents: {
    autoPayment: true,
    privacyCollection: true,
    privacyThirdParty: true,
    pgTerms: true,
  },
};

describe('toDemandCreateRequest', () => {
  it('가격 구간을 백엔드 min·max 경계값으로 옮긴다', () => {
    const request = toDemandCreateRequest(FORM, IDS);

    expect(request).toMatchObject({
      catalogId: 7,
      payMethodId: 1,
      desiredPriceMin: 10_001,
      desiredPriceMax: 20_000,
      quantity: 2,
    });
  });

  it('대체상품에 동의하면 앞뒤 공백을 뺀 가능 범위를 추가 요청사항으로 보낸다', () => {
    const request = toDemandCreateRequest(FORM, IDS);

    expect(request.isSubstitutable).toBe(true);
    expect(request.extraRequirement).toBe('같은 용량이면 브랜드 무관');
  });

  it('동의를 철회하면 남아 있던 가능 범위를 보내지 않는다', () => {
    const request = toDemandCreateRequest({ ...FORM, substituteAgreed: false }, IDS);

    expect(request.isSubstitutable).toBe(false);
    expect(request.extraRequirement).toBeUndefined();
  });

  it('대체상품 동의를 고르지 않았으면(null) 비동의로 보낸다', () => {
    expect(toDemandCreateRequest({ ...FORM, substituteAgreed: null }, IDS).isSubstitutable).toBe(
      false,
    );
  });

  it('동의 4종을 받은 그대로 1:1로 옮긴다', () => {
    const request = toDemandCreateRequest(
      { ...FORM, consents: { ...FORM.consents, privacyThirdParty: false } },
      IDS,
    );

    expect(request).toMatchObject({
      autoPaymentAgreed: true,
      privacyCollectionAgreed: true,
      privacyThirdPartyAgreed: false,
      paymentAgencyTermsAgreed: true,
    });
  });

  it('가격 구간을 고르지 않았으면 등록을 막는다', () => {
    expect(() => toDemandCreateRequest({ ...FORM, priceBand: null }, IDS)).toThrow();
  });
});

describe('computeDday', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 로컬 시각 기준(끝에 Z 없음). 함수가 로컬 자정으로 달력일을 센다.
    vi.setSystemTime(new Date('2026-09-30T15:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('시각과 무관하게 달력일 차이로 센다', () => {
    expect(computeDday('2026-10-01T09:00:00')).toBe(1);
    expect(computeDday('2026-10-01T23:59:00')).toBe(1);
    expect(computeDday('2026-10-03T00:00:00')).toBe(3);
  });

  it('오늘 마감은 이미 지난 시각이어도 D-0이다', () => {
    expect(computeDday('2026-09-30T09:00:00')).toBe(0);
  });

  it('지난 마감·없는 값·깨진 값은 0이다', () => {
    expect(computeDday('2026-09-28T09:00:00')).toBe(0);
    expect(computeDday(null)).toBe(0);
    expect(computeDday('not-a-date')).toBe(0);
  });
});
