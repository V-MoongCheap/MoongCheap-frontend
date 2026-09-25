/**
 * 결제수단 화면(B-14 결제수단 관리, B-09 수요 등록의 결제수단 영역)이 요구하는 타입.
 *
 * `types/address.ts`와 같은 원칙이다. 백엔드 응답을 옮긴 것이 아니라 **화면이 필요로 하는 모양**이며,
 * 백엔드 DTO(`types/api/payment.ts`)에서의 변환은 `lib/paymentApi.ts`가 맡는다.
 *
 * 결제수단의 원본은 토스페이먼츠 브랜드페이이고, 백엔드가 토스 목록을 동기화해 내려준다. 카드번호·
 * 유효기한·CVC는 앱이 보관하지 않는다. 번호는 토스가 마스킹한 문자열만 받는다.
 */

/** 등록된 결제수단(카드·계좌) 한 건. */
export interface PaymentMethod {
  /**
   * 결제수단 id. 수요 등록·참여 요청의 `payMethodId`로 그대로 보내므로 백엔드와 같은 숫자로 둔다
   * (라우트 파라미터로 쓰지 않아 문자열로 바꿀 이유가 없다).
   */
  id: number;
  /** 카드사·은행 표시명. 예: '신한카드'. */
  name: string;
  /** 토스가 마스킹한 번호. 형식이 고정돼 있지 않아 그대로 표시한다. 없으면 null. */
  maskedNumber: string | null;
  /** 기본결제수단 여부. 계정당 최대 1건이 true. */
  isDefault: boolean;
  /**
   * 기본·자동결제 수단으로 고를 수 있는지. 백엔드 상태가 `ACTIVE`일 때만 true다.
   * `INACTIVE`는 목록에 보이지만 선택할 수 없다(백엔드 가이드 6.4).
   */
  isSelectable: boolean;
}
