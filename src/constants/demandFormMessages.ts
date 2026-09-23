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

  /** 결제수단 카드 아래 안내. */
  autoPaymentNote: '낙찰이 확정되면 등록된 결제수단으로 자동 결제돼요',
  /**
   * 쓸 수 있는 결제수단이 없을 때의 배너와 버튼(FN-B09-02 '결제수단 상태 배너 (미등록 시)').
   * 문구는 기능명세서 그대로다. 시안에 이 상태가 없다.
   */
  paymentMissing: '등록해두지 않으면 낙찰돼도 놓칠 수 있어요',
  registerPaymentMethod: '결제수단 등록하기',

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

  /**
   * 등록 성공 안내(FN-B09-04 구성 요소 '접수 완료 안내'). 문구는 기능명세서 v3.0 그대로다.
   *
   * ⚠️ 명세에 '문구 확정 필요'가 붙어 있고 시안에 완료 화면이 없다. 확정되면 여기만 바꾼다.
   *    접수 시점에는 모집 마감일이 정해지지 않아 구체 일자를 넣지 않는다(BR-B09-04-06).
   */
  submitSuccess: '접수 완료! 비슷한 조건이 모이면 공구가 열려요. 내 대기에서 확인할 수 있어요',
} as const;

/**
 * 약관 동의 목록. 전부 필수라 하나라도 빠지면 참여 버튼이 잠긴다.
 *
 * 백엔드 `DemandCreateRequestDto`가 동의를 4개(`autoPaymentAgreed`·`privacyCollectionAgreed`·
 * `privacyThirdPartyAgreed`·`paymentAgencyTermsAgreed`)로 나눠 받으므로(전부 `@AssertTrue`),
 * 폼도 같은 4개를 각각 받아 `lib/demandApi.toDemandCreateRequest`에서 1:1로 옮긴다. 하나의 동의를
 * 여러 필드에 함께 넣어 받지 않은 동의를 참으로 꾸미지 않기 위해서다.
 *
 * ⚠️ 시안(`1153:71238`·`1153:71479`·`1153:71709`)은 개인정보 동의가 1줄이라 이 목록과 개수가
 *    다르다. `제3자 제공` 줄과 각 문구는 **디자인/법무 확인 대상**이다(백엔드 규격에 맞춰 먼저 넣어
 *    둔 것). 확정되면 라벨·구성을 이 목록에서 조정한다.
 */
export const DEMAND_FORM_CONSENTS = [
  { key: 'autoPayment', label: '[필수] 자동결제 동의' },
  { key: 'privacyCollection', label: '[필수] 개인정보 수집 • 이용동의' },
  { key: 'privacyThirdParty', label: '[필수] 개인정보 제3자 제공 동의' },
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
