import type { PriceBandKey } from '@/constants/businessRules';
import type { DemandConsentKey } from '@/constants/demandFormMessages';

/**
 * B-09 수요 등록/참여 폼이 들고 있는 값 전부.
 *
 * 섹션을 나눠 만들기 때문에 값의 모양을 먼저 못박는다. 각 섹션 컴포넌트는 자기 값과 `onChange`
 * 만 받고, 상태는 `DemandFormView` 한 곳에만 둔다.
 *
 * 아직 고르지 않은 값은 `null`이다. 서버로 보내는 규격은 백엔드 미확정이라 여기 담지 않는다.
 *
 * 결제수단은 여기 없다. 사용자가 고르는 값이 아니라 본인 결제수단 목록에서 정해지므로
 * (`pickPaymentMethodForDemand`) `DemandFormView`가 제출 시점에 따로 넣는다.
 */
export interface DemandFormValues {
  /** 수량. 기본 1, 범위는 `ORDER_QUANTITY_MIN`~`MAX`(FN-B09-01). */
  quantity: number;
  /** 고른 배송지. 아직 없으면 `null`. */
  addressId: string | null;
  /** 희망 가격대. `PRICE_BANDS`의 key(FN-B09-01). */
  priceBand: PriceBandKey | null;
  /** 대체 상품 추천 동의. 아직 안 고르면 `null`. */
  substituteAgreed: boolean | null;
  /** 동의했을 때 적는 가능 범위. 최대 `SUBSTITUTE_NOTE_MAX_LENGTH`자(FN-B09-03). */
  substituteNote: string;
  /** 필수 약관 3종. 전부 `true`여야 참여 버튼이 열린다. */
  consents: Record<DemandConsentKey, boolean>;
}
