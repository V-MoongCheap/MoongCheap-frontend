/**
 * 낙찰 결과(B-19) 백엔드 DTO.
 *
 * `types/api/demand.ts`와 같은 역할이다. 여기는 **백엔드 응답을 그대로 옮긴 것**이고, 화면 타입
 * (`types/awardResult.ts`)으로의 변환은 `lib/auctionResultApi.ts`가 맡는다.
 *
 * 출처: 백엔드 develop `DemandBoardController.getAuctionResult` · `AuctionResultDto`(2026-09-22 확인).
 * `GET /api/demand-boards/{demandBoardId}/auction-result`
 */

/**
 * 수요보드 상태. 낙찰 결과는 `GB_ACTION_REQUIRED`(낙찰 확정, 결제 대기)에서만 의미가 있다.
 * 값 집합은 백엔드 `DemandStatus`를 그대로 옮긴 것이며, 화면은 지금 이 값을 쓰지 않는다.
 */
export type DemandBoardStatusDto =
  'GB_GATHERING' | 'GB_AWARDING' | 'GB_ACTION_REQUIRED' | 'GB_CLOSED' | 'GB_CANCELED';

/**
 * `GET /api/demand-boards/{demandBoardId}/auction-result` 응답(`AuctionResultDto`).
 *
 * ⚠️ `thumbnail_url`만 snake_case다. 같은 record의 다른 필드는 camelCase라 JSON에서도 이 값만
 *    표기가 다르게 나간다. 백엔드에 정정을 요청해 두었고(이슈 #137), 고쳐지면 이 필드도 바꾼다.
 *
 * ⚠️ `paymentDeadlineAt`은 낙찰 시각(`judged_at`)에 48시간을 더해 5분 단위로 올림한 값이다.
 *    낙찰 시각 자체는 응답에 없다(이슈 #137의 요청 항목).
 */
export interface AuctionResultDto {
  demandStatus: DemandBoardStatusDto;
  /** 상품 도감 이름. 화면 상품 카드 제목. */
  catalogName: string;
  /** 상품 도감 썸네일. 필드명이 snake_case인 것은 위 주석 참고. */
  thumbnail_url: string | null;
  /** 확정 낙찰 단가(원). 화면 '최종 낙찰가'. */
  unitPrice: number | null;
  /** 배송비(원). 결제 예정 금액 산출에 쓴다. */
  shippingFee: number | null;
  /** 낙찰 셀러명. 화면 '셀러명'. */
  sellerName: string | null;
  /** 내 참여 수량(개). 화면 '내 참여 수량'. */
  quantity: number | null;
  /** 보드 참여 인원 수. 화면 '참여 뭉치단'. */
  participantCount: number | null;
  /** 보드 전체 참여 수량 합계. 화면에는 쓰지 않는다. */
  totalParticipantQuantity: number | null;
  /** 자동결제 예정 시각(낙찰 +48시간). 화면 상단 안내 문구에 쓴다. */
  paymentDeadlineAt: string | null;
  /** 낙찰 사유(AI 판정). 화면 표기 위치가 아직 정해지지 않아 쓰지 않는다. */
  awardReason: string | null;
}

/**
 * `GET /api/demand-boards/{demandBoardId}` 응답(`DemandBoardDto`) 중 낙찰 결과가 쓰는 희망 가격대만.
 *
 * 낙찰 결과 응답에 희망가가 없어 보드 단건 조회로 보충한다(#187). 전체 모양은 수요 상세(B-12, #184)가
 * `types/api/demandBoard.ts`에 들이므로, 그 PR이 머지되면 이 타입을 지우고 그쪽을 쓴다.
 */
export interface DemandBoardPriceDto {
  desiredPriceMin: number | null;
  desiredPriceMax: number | null;
}
