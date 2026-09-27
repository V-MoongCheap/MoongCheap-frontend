/**
 * 수요 상세(B-12) 화면 타입. 백엔드 `DemandBoardDto`를 화면이 쓰는 모양으로 옮긴 것이다
 * ([[lib/demandBoardApi]] `toDemandBoardDetail`).
 */
export interface DemandBoardDetail {
  id: string;
  /** 상품 상세(B-08) 링크에 쓰는 도감 id. */
  catalogId: string;
  catalogName: string;
  thumbnailUrl?: string;
  /** 확정 수요 인원. */
  participantCount: number;
  /** 응찰한 판매자 수. */
  sellerCount: number;
  /** 희망 가격대 라벨. 예: `1만원 이하`, `35만~41만원`. 값이 없으면 빈 문자열. */
  desiredPriceLabel: string;
  /** 마감 시각(ISO, 시간대 없음). 없으면 마감 표기를 하지 않는다. */
  saleEndAt?: string;
  /** 본인이 참여 중인지. 참여 중이면 참여 버튼 대신 내 대기로 보낸다(MC-B12-01). */
  isParticipating: boolean;
}
