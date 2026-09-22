/**
 * 화면 B-16(대체상품 수락/거절)이 요구하는 타입.
 *
 * `types/participation.ts`와 같은 원칙이다 — 백엔드 응답을 그대로 옮긴 것이 아니라 **화면이 필요로
 * 하는 모양**이며, 백엔드 DTO(`types/api/demand.ts`의 단건 `DemandItemDto`)에서 `lib/demandApi.ts`가
 * 변환해 이 타입으로 맞춘다.
 *
 * 대체상품 제안(수요 상태 `SUBSTITUTE_OFFERED`)에서만 의미가 있다. 그 밖의 상태면 화면이 조회 결과의
 * `isOffer=false`를 보고 '이미 처리된 제안' 안내로 갈린다.
 */

/** 상품 요약(원 수요 상품·대체상품 공통). */
export interface SubstituteProductSummary {
  /** 상품명. 출처: `catalog.name`. */
  readonly name: string;
  /** 규격 요약. 출처: `catalog.specSummary`. 없으면 undefined(부제 생략). */
  readonly specSummary?: string;
  /** 정가(원). 대체상품 카드의 참고가. 출처: `catalog.listPrice`. 없으면 undefined(표기 생략). */
  readonly listPrice?: number;
}

export interface SubstituteOffer {
  /** 수요 id. 라우트 파라미터·수락/거절 호출 대상. */
  readonly demandId: string;
  /**
   * 대체상품 제안 상태인지. 조회 시점에 수요가 `SUBSTITUTE_OFFERED`가 아니거나 대체상품 정보가
   * 없으면 false — 화면은 '이미 처리된 제안' 안내로 빠진다(직접 진입·뒤로가기 후 재방문 방어).
   */
  readonly isOffer: boolean;
  /** 내가 등록한 원 수요 상품. 출처: 단건 DTO의 `catalog`. */
  readonly requested: SubstituteProductSummary;
  /**
   * AI가 제안한 대체상품. 출처: `demandBoard.catalog`(상태가 `SUBSTITUTE_OFFERED`일 때만 채워진다).
   * `isOffer=false`면 null.
   */
  readonly substitute: SubstituteProductSummary | null;
  /** 내 참여 수량(개). 출처: `quantity`. 미확정이면 undefined. */
  readonly quantity?: number;
  /** 내 희망 가격대 라벨(`PRICE_BANDS` 라벨 또는 범위). 출처: `desiredPrice*`. */
  readonly desiredPriceLabel: string;
  /** 대체 공구 현재 참여 인원. 출처: `demandBoard.participantCount`. 없으면 undefined. */
  readonly participantCount?: number;
}
