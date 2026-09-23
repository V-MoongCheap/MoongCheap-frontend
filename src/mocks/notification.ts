import type { MarketingConsent } from '@/types/notification';

/**
 * 알림 설정 목 데이터.
 *
 * `mocks/auth.ts`와 같은 규칙이다. 실제 연동 시 이 함수의 **본문만** API 호출로 교체하고
 * 반환 타입은 그대로 둔다.
 *
 * 시안이 토글 3개를 모두 켜진 상태로 그려 두어 목도 같은 값으로 맞춘다.
 */

const mockConsent: MarketingConsent = {
  agreed: true,
  push: true,
  email: true,
};

export async function mockGetMarketingConsent(): Promise<MarketingConsent> {
  return mockConsent;
}
