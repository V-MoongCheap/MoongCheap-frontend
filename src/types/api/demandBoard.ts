/**
 * 수요보드 백엔드 응답 타입. 백엔드 record를 그대로 옮긴 것이라 화면은 이 타입을 직접 쓰지 않는다.
 * 변환은 `lib/demandBoardApi.ts`가 맡는다(`types/api/payment.ts`와 같은 구조).
 *
 * ⚠️ `types/api/demand.ts`의 `DemandBoardDto`는 참여 목록 응답 안에 들어 있는 다른 모양이다.
 *    이름이 겹치지 않게 이 파일은 상품 도감 기준 조회 응답만 담는다.
 */

/**
 * 상품 도감 기준 수요보드 한 건(`CatalogDemandBoardListDto.DemandBoardCardDto`).
 *
 * 백엔드가 `GB_GATHERING`(모이는 중)이면서 마감 전인 보드만 준다. 정렬도 마감 임박순
 * (`sale_end_at ASC, id ASC`)으로 백엔드가 한다.
 */
export interface CatalogDemandBoardCardDto {
  id: number;
  /** 확정 수요 인원. */
  participantCount: number;
  /** 응찰 중(`BIDDING`)인 상품 수 = 응찰한 뭉치셀러 수. */
  sellerCount: number;
  /** 보드 희망 가격대 하한(원). `Integer`라 null일 수 있다. */
  priceMin: number | null;
  /** 보드 희망 가격대 상한(원). `Integer`라 null일 수 있다. */
  priceMax: number | null;
  /** 마감 시각(`LocalDateTime`, 시간대 없음). */
  saleEndAt: string | null;
  /** 본인이 이 보드에 참여 중(`ASSIGNED`·`PAYMENT_PENDING`)인지. */
  isParticipating: boolean;
}

/** `GET /api/demand-boards/catalog/{catalogId}` 응답. 페이지 크기 기본 20. */
export interface CatalogDemandBoardListDto {
  demandBoards: CatalogDemandBoardCardDto[];
  size: number;
  hasNext: boolean;
  page: number;
}
