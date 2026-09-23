import type { AwardResult } from '@/types/awardResult';

/**
 * 낙찰 성공 정보(B-19) 목 데이터.
 *
 * `mocks/auth.ts`와 같은 규칙이다. 실제 연동 시 이 함수의 **본문만** 낙찰 결과 조회로 교체하고
 * 반환 타입은 그대로 둔다. 값은 시안(B-19)의 예시를 옮겼다. 단건 상세라 객체를 그대로 반환한다
 * (확정된 응답 관례 — 도메인 A 실측: 단건 상세는 래핑 없이 객체).
 */
const mockAwardResult: AwardResult = {
  id: 'aw-1',
  productName: '락토핏 생 유산균 뷰티',
  category: '종근당 건강',
  finalBidPrice: 27300,
  desiredPriceLabel: '3만원 이하',
  myQuantity: 1,
  sellerName: '유산균좋아',
  awardedAt: '2026.08.12',
  finalBidCount: 12,
  participantGroupCount: 1200,
  expectedPaymentPrice: 27300,
};

export async function mockGetAwardResult(): Promise<AwardResult> {
  return mockAwardResult;
}
