/**
 * B-09 수요 등록/참여 화면 문구. 시안 `1153:71238`(기본) · `1153:71352`(기본 배송지 있음) ·
 * `1153:71479`(툴팁) · `1153:71709`(대체 상품 동의) 그대로 옮겼다.
 *
 * 섹션을 두 사람이 나눠 만들기 때문에 문구를 여기 한 곳에 모은다. 각자 컴포넌트에 문자열을
 * 박으면 같은 뜻을 다르게 쓰게 된다.
 */

export const DEMAND_FORM_SECTIONS = {
  product: { id: 'demand-product', title: '제품 상세' },
  address: { id: 'demand-address', title: '배송지 등록' },
  price: { id: 'demand-price', title: '희망가격' },
  payment: { id: 'demand-payment', title: '결제수단' },
  substitute: { id: 'demand-substitute', title: '대체 상품 동의' },
} as const;

export const DEMAND_FORM_MESSAGES = {
  /** 앱바 제목. */
  appBarTitle: '수요 등록/참여',

  /**
   * 제품 상세 카드 아래 안내.
   *
   * ⚠️ 시안은 `최대 48동안 낙찰대기돼요!`로 단어가 빠져 있다. 뜻이 통하지 않아 `시간`을 넣었다.
   *    확인 기한 48시간은 `CONFIRM_WINDOW_HOURS`(FN-B09-02)와 같은 값이다.
   */
  auctionWaitNote: '최대 48시간 동안 낙찰대기돼요!',

  /** 배송지가 하나도 없을 때 카드 안에 뜨는 행. */
  addAddress: '신규 배송지 추가',
  /** 배송지 카드의 기본 배송지 배지. */
  defaultAddressBadge: '기본배송지',
  editAddress: '수정',
  deleteAddress: '삭제',

  /** 결제수단 상단 프로모션 배너. 토스 연동 시 서버가 내려줄 수 있어 배선 시점에 교체한다. */
  tossPromotion: '토스페이 1천원 즉시 할인 (일 선착순 320명)',
  /** 결제수단 카드 아래 안내. */
  autoPaymentNote: '낙찰이 확정되면 등록된 결제수단으로 자동 결제돼요',

  /**
   * 제품 카드 오른쪽 값의 라벨.
   *
   * ⚠️ 피그마 레이어 이름은 `희망 가격대`인데 실제로 그려진 글자는 `시장평균가`다. 이름이 아니라
   *    화면에 보이는 쪽을 따랐다. 사용자가 아래에서 고르는 희망가격과는 **다른 값**이다.
   */
  marketPrice: '시장평균가',
  /** 수량 스테퍼 왼쪽 라벨. */
  quantity: '수량',
  /** 수량 스테퍼 왼쪽에 붙는 현재 값 표기. */
  quantityUnit: (count: number) => `${count}개`,

  /** 희망가격을 시장평균가보다 높게 고르면 뜨는 토스트(시안 `1153:71594`). */
  priceOverMarket: '시장평균가보다 높은 금액입니다',

  /** 대체 상품 동의 제목 옆 물음표를 눌렀을 때 뜨는 말풍선. */
  substituteTooltip: '대체 상품이란? 내가 원하는 상품이 없을시 비슷한 대체 상품을 추천드려요.',
  substituteAgree: '동의',
  substituteDisagree: '동의 안함',
  /** `동의`를 골랐을 때 펼쳐지는 입력칸. 길이 제한은 `SUBSTITUTE_NOTE_MAX_LENGTH`(FN-B09-03). */
  substituteNotePlaceholder: '대체상품 가능 범위를 입력해주세요.',

  /** 하단 고정 버튼. 필수 동의 3개가 모두 켜져야 활성화된다. */
  submit: '뭉치 참여하기',
} as const;

/**
 * 결제수단 선택지. 시안에는 4개가 다 있지만 **동작은 간편결제만 붙인다.**
 *
 * 시안 B-09 프레임 설명이 범위를 못박아 뒀다.
 *   "결제수단 중 카드결제/계좌결제/휴대폰결제는 구현하지 않음"
 *   "간편결제도 토스페이만 구현"
 *   "네이버페이, 카카오페이는 디자인상으로만 존재"
 *
 * 그래서 화면에는 시안대로 다 그리되 `implemented`가 false인 것은 고를 수 없게 한다. 임의로
 * 숨기지 않는 이유는 시안과 달라지기 때문이다.
 */
export const DEMAND_PAYMENT_METHODS = [
  { key: 'easy', label: '간편결제', implemented: true },
  { key: 'card', label: '카드결제', implemented: false },
  { key: 'account', label: '계좌결제', implemented: false },
  { key: 'phone', label: '휴대폰 결제', implemented: false },
] as const;

export type DemandPaymentMethodKey = (typeof DEMAND_PAYMENT_METHODS)[number]['key'];

/**
 * 간편결제 안의 사업자. 토스만 실제로 고를 수 있다.
 *
 * 화면에는 로고 이미지(`DEMAND_FORM_ASSETS`)가 들어가고, 여기 `label`은 그 이미지의 대체
 * 텍스트로 쓰인다. 카카오 로고에는 `kakao` 글자가 없어서 이름을 여기서 준다.
 *
 * ⚠️ 시안 컴포넌트에는 토스 옆에 `혜택` 배지가 붙어 있지만 화면에는 나오지 않는다. 배지
 *    프레임(`1153:71308`)의 x가 130인데 부모 박스 폭이 107이라 잘려 나간다. 보이지 않는 것을
 *    임의로 살리지 않으려고 필드를 두지 않았다.
 */
export const DEMAND_EASY_PAY_PROVIDERS = [
  { key: 'toss', label: '토스페이', implemented: true },
  { key: 'naver', label: '네이버페이', implemented: false },
  { key: 'kakao', label: '카카오페이', implemented: false },
] as const;

export type DemandEasyPayProviderKey = (typeof DEMAND_EASY_PAY_PROVIDERS)[number]['key'];

/**
 * 약관 동의 목록. 셋 다 필수라 하나라도 빠지면 참여 버튼이 잠긴다.
 *
 * ⚠️ 첫 프레임(`1153:71238`)은 첫 줄이 `기본 배송지로 설정`인데, 뒤에 만든 두 프레임
 *    (`1153:71479` · `1153:71709`)은 `[필수] 자동결제 동의`다. 늦은 쪽 둘이 서로 일치하고
 *    약관 목록에 배송지 설정이 섞이는 것도 어색해 뒤쪽을 따랐다. 디자인 확인 대상.
 */
export const DEMAND_FORM_CONSENTS = [
  { key: 'autoPayment', label: '[필수] 자동결제 동의' },
  { key: 'privacy', label: '[필수] 개인정보 수집 • 이용동의' },
  { key: 'pgTerms', label: '[필수] 결제대행 서비스 이용약관 동의' },
] as const;

export type DemandConsentKey = (typeof DEMAND_FORM_CONSENTS)[number]['key'];

/** 필수 동의 3개를 한 번에 켜고 끄는 체크박스. */
export const DEMAND_CONSENT_ALL_LABEL = '주문 내용 확인 및 결제동의';

/*
 * 희망가격 라디오의 라벨은 여기 두지 않고 `PRICE_BANDS.label`(businessRules)을 그대로 쓴다.
 *
 * ⚠️ 같은 시안 안에서 표기가 갈린다. 라디오 목록은 `5천원대 이하`처럼 `대`가 붙는데, 제품 카드의
 *    시장평균가는 `3만원 이하`로 붙지 않는다. 기능명세서의 가격 매핑표(FN-B09-01)와 `PRICE_BANDS`
 *    도 `대` 없는 쪽이고, 구간이 0~5,000원이라 `5천원 이하`가 뜻도 맞다. 그래서 `대` 없는 쪽으로
 *    통일했다. 디자인 확인 대상.
 */
