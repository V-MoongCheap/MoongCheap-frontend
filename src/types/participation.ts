import type { ParticipationStatus } from '@/constants/participationStatus';

/**
 * 화면 B-17(내 뭉치 참여 목록) 카드 한 건이 요구하는 타입.
 *
 * `types/order.ts`와 같은 원칙이다. 백엔드 응답을 그대로 옮긴 것이 아니라 **화면이 필요로 하는 모양**
 * 이며, 백엔드 DTO(`types/api/demand.ts`)에서 `lib/demandApi.ts`가 변환해 이 타입으로 맞춘다.
 */
export interface ParticipationItem {
  /** 수요 id(문자열화). 라우트 파라미터·리스트 key. */
  readonly id: string;
  /**
   * 수요보드 id. 낙찰 결과(B-19) 조회가 수요가 아니라 **보드** 기준이라
   * (`GET /api/demand-boards/{id}/auction-result`) 카드가 이동 경로를 만들 때 쓴다.
   * 보드 미배정(방금 등록한 모이는 중) 수요는 `demandBoard`가 null이라 undefined다.
   */
  readonly demandBoardId?: number;
  /**
   * 상품명. 시안 카드 제목(볼드). 출처: 들어간 보드의 상품(`demandBoard.catalog.name`), 없으면
   * 신청 상품(`catalog.name`). 대체상품을 수락한 수요는 둘이 다르다. 제안만 받은 상태
   * (`SUBSTITUTE_OFFERED`)는 보드 상품이 와도 아직 들어가지 않았으므로 신청 상품이다
   * (`lib/demandApi.ts` `joinedCatalog`).
   */
  readonly productName: string;
  /** 규격 요약. 시안 카드 부제. 출처는 상품명과 같은 상품의 `specSummary`. 없으면 undefined(부제 생략). */
  readonly specSummary?: string;
  /** 참여 수량(개). 출처: `quantity`. DTO상 null 허용이라 미확정이면 undefined(수량 문구 생략). */
  readonly quantity?: number;
  /**
   * 가격 라벨. 낙찰 전(모이는 중·배정완료·확인필요)은 희망 가격대(`PRICE_BANDS` 라벨),
   * 완료는 확정 낙찰가(`product.unitPrice`)를 표기한다(산출은 `lib/demandApi.ts`).
   */
  readonly priceLabel: string;
  /**
   * 참여 인원 수. 시안 카드의 'N명 참여' 배지. 출처: `demandBoard.participantCount`.
   * 보드 미배정(방금 등록한 모이는 중) 수요는 보드가 없어 **undefined**다 → 배지 생략.
   */
  readonly participantCount?: number;
  /**
   * 마감 시각(ISO, 시간대 없음). 카드의 D-N·마감 임박 카운트다운·마감 표기와 마감 임박순 정렬의 기준.
   * 출처: 보드가 있으면 `demandBoard.saleEndAt`(실제 공구 마감), 보드 미배정이면 `desireEndAt`
   * (수요 희망 마감). 수요 마감은 등록 시 now+2일로 고정이라 보드가 있는데 이걸 쓰면 D-N이 보드 마감과
   * 어긋난다(#189). 둘 다 없으면 undefined(마감 표기 생략).
   */
  readonly deadline?: string;
  /**
   * 보드에 배정됐지만 아직 낙찰 전인지(DTO `ASSIGNED`). 마감이 지났는데 이 값이 참이면 낙찰 판정 중이다
   * (보드 `GB_AWARDING`, #190). 낙찰 후 결제 대기(`PAYMENT_PENDING`)도 배정완료 탭이지만 판정은 끝났다.
   */
  readonly isAwaitingAward: boolean;
  /** 참여 상태. 카드 배지·탭 필터·액션이 참조한다. 출처: `status`(DTO→화면 매핑). */
  readonly status: ParticipationStatus;
}

/**
 * 참여 목록 한 페이지. `lib/demandApi.ts`가 `DemandListDto`에서 변환한다.
 * 페이지 번호는 0부터이며(`BR-B17-01-11` 무한 스크롤), `hasNext`로 다음 페이지 유무를 판단한다.
 */
export interface ParticipationPage {
  readonly items: ParticipationItem[];
  readonly page: number;
  readonly hasNext: boolean;
}
