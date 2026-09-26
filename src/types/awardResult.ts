/**
 * 화면 B-19(낙찰 성공 정보) 낙찰 결과 한 건이 요구하는 타입.
 *
 * `types/participation.ts`와 같은 원칙이다. 백엔드 응답을 옮긴 것이 아니라 **화면이 필요로 하는 모양**
 * 이며, `lib/auctionResultApi.ts`가 백엔드 DTO에서 변환한다.
 *
 * 응답에 값이 없으면(백엔드 `Integer`·`String`이 null) 해당 키는 **undefined**이고 화면은 그 줄을
 * 숨긴다. mock으로 채우지 않는다(#187 — mock이 실데이터처럼 보이던 결함).
 *
 * ⚠️ 명세(FN-B19-01)에 있지만 응답에 **없어** 아직 그리지 못하는 값: 낙찰 날짜·응찰 건수·브랜드.
 *    백엔드에 요청해 두었다(이슈 #137·#187). 응답에 추가되면 이 타입과 변환만 늘리면 된다.
 *
 * 낙찰(award)은 "48시간 내 자동결제 대기" 상태의 상세다. 용어 'award'는 코드 스타일 컨벤션 도메인
 * 용어표(낙찰 = award/winningBid)를 따른다.
 */
export interface AwardResult {
  /** 상품명. 상품 카드 제목(볼드). */
  readonly productName: string;
  /** 상품 썸네일. `isRenderableImageSrc`를 통과할 때만 그린다. */
  readonly thumbnailUrl?: string;
  /** 최종 낙찰가(원, 확정 낙찰 단가). */
  readonly finalBidPrice?: number;
  /** 희망 가격대 라벨(예: 1만원 이하). 보드 조회로 채우며, 조회 실패면 undefined. */
  readonly desiredPriceLabel?: string;
  /** 내 참여 수량(개). */
  readonly myQuantity?: number;
  /** 낙찰 셀러명. */
  readonly sellerName?: string;
  /** 보드 참여 인원(명). 화면 '참여 뭉치단'. */
  readonly participantCount?: number;
  /** 보드 전체 참여 수량(개). 화면 '총 참여 수량'. */
  readonly totalParticipantQuantity?: number;
  /** 결제 예정 금액(원) = 낙찰 단가 × 내 수량 + 배송비(FN-B19-01). */
  readonly expectedPaymentPrice?: number;
  /** 자동결제 예정 시각 표기(예: `9월 28일 (월) 오후 9:05`). 상단 안내 문구에 쓴다. */
  readonly paymentDeadlineLabel?: string;
}
