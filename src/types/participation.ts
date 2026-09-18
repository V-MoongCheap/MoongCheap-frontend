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
  /** 상품명. 시안 카드 제목(볼드). 출처: `catalog.name`. */
  readonly productName: string;
  /** 규격 요약. 시안 카드 부제. 출처: `catalog.specSummary`. 없으면 undefined(부제 생략). */
  readonly specSummary?: string;
  /** 참여 수량(개). 출처: `quantity`. */
  readonly quantity: number;
  /**
   * 가격 라벨. 낙찰 전(모이는 중·배정완료·확인필요)은 희망 가격대(`PRICE_BANDS` 라벨),
   * 완료는 낙찰가(보드 확정가)를 표기한다. 산출은 `lib/demandApi.ts`.
   */
  readonly priceLabel: string;
  /**
   * 참여 인원 수. 시안 카드의 'N명 참여' 배지. 출처: `demandBoard.participantCount`.
   * 보드 미배정(방금 등록한 모이는 중) 수요는 보드가 없어 **undefined**다 → 배지 생략.
   */
  readonly participantCount?: number;
  /** 마감까지 남은 일수. 시안의 'D-N' 배지. 출처: `desireEndAt`(오늘 기준 남은 일수, 최소 0). */
  readonly dday: number;
  /** 참여(접수) 날짜 'YYYY.MM.DD'. 목록의 날짜 그룹 헤더 기준. 출처: `createdAt`. */
  readonly requestedAt: string;
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
