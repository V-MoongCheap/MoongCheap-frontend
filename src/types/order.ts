import type { OrderStatus } from '@/constants/orderStatus';

/**
 * 주문 화면(B-21 목록 · B-28 상세)이 요구하는 타입.
 *
 * `types/user.ts`와 같은 원칙이다. 백엔드 응답을 옮긴 것이 아니라 **화면이 필요로 하는 모양**이며,
 * API 계층에서 변환해 이 타입으로 맞춘다. 백엔드 원형은 `types/api/order.ts`, 변환은 `lib/orderApi.ts`다.
 */

/**
 * 주문에 담긴 상품 한 줄.
 *
 * 값은 주문 생성 시점의 **스냅샷**이다(`BR-B21-01-02`). 원본 상품이 바뀌거나 지워져도 주문
 * 내역의 표시는 그대로 유지돼야 하므로, 상품 id를 들고 조회하지 않고 값을 그대로 담는다.
 */
export interface OrderItem {
  id: string;
  /** 상품명. 시안 예) `[작심삼일 특가] 슬림 버니&베어 캔디` */
  name: string;
  /** 선택한 옵션. 없을 수 있다(시안 2번째 카드). */
  option?: string;
  /** 수량 표기. `1박스`처럼 단위가 붙은 문자열이라 숫자가 아니다. */
  quantity: string;
  /** 결제 금액(원). 표시할 때 자리수를 넣는다. */
  price: number;
  /**
   * 상품 이미지. 실제로는 API가 준다. 목은 디자인이 넘겨준 에셋을 쓴다.
   * 선택값으로 둬, 응답에 이미지가 없는 주문에서도 카드가 깨지지 않게 한다(회색 자리로 대체).
   */
  imageUrl?: string;
}

/** 주문 목록(B-21) 카드 한 장. */
export interface OrderSummary {
  id: string;
  /** 주문일자. 시안 표기는 `26.08.20`이다. */
  orderedAt: string;
  /** 판매자(스토어)명. */
  sellerName: string;
  /**
   * 주문 상태. 백엔드가 화면이 모르는 상태를 보내면 비어 온다(`lib/orderApi.ts`의 `toOrderStatus`).
   *
   * 다른 상태로 대신 채우지 않는 이유는 실제와 다른 상태를 보여 주게 되기 때문이다. 모르는 상태에 붙일
   * 문구도 시안에 없어, 카드는 상태 줄만 비우고 나머지를 그린다.
   */
  status?: OrderStatus;
  /**
   * 주문에 담긴 상품. 시안은 카드마다 1건이지만 공동구매 주문은 여러 건이 될 수 있어 배열로 둔다.
   */
  items: OrderItem[];
}

/**
 * 주문 목록(B-21)이 카드 한 장을 그리는 데 필요한 것.
 *
 * 상세 경로를 함께 담는다. 라우팅은 `app/`이 정하고 도메인 컴포넌트는 받은 값만 쓴다.
 */
export interface OrderListItem {
  order: OrderSummary;
  detailHref: string;
}

/** 주문 목록 한 페이지. 무한 스크롤(`BR-B21-01-11`, 20건 단위)이 다음 페이지를 이어 붙인다. */
export interface OrderListPage {
  orders: OrderSummary[];
  /** 이 페이지의 번호. 0부터다. */
  page: number;
  hasNext: boolean;
}

/** B-28 결제내역 한 줄. 시안이 항목을 고정하지 않고 나열만 해 배열로 받는다. */
export interface OrderPaymentLine {
  label: string;
  /** 원 단위. 할인·사용 금액은 음수로 담아 그대로 표시한다(시안 `-5,400원`). */
  amount: number;
}

/** 주문 상세(B-28)가 필요로 하는 데이터. */
export interface OrderDetail extends OrderSummary {
  /** 주문번호. 시안 표기는 `12012348371629`. */
  orderNumber: string;
  /**
   * 결제일. 시안은 주문일자가 아니라 `26.08.26 결제`로 결제일을 쓴다.
   *
   * ⚠️ 백엔드 상세 응답에 결제일이 없다(주문일만 온다). 결제대기 주문은 결제일 자체가 없기도 하다.
   *    없으면 화면이 주문일자만 쓴다. 필드가 생기면 `lib/orderApi.ts`에서 채운다.
   */
  paidAt?: string;
  /** 배송지를 입력하기 전 주문은 값이 비어 온다(배송지 입력은 결제완료 뒤다). */
  shipping: {
    recipient?: string;
    /** 마스킹된 휴대폰 번호(`BR-B28-01` 배송 정보 마스킹). 서버가 마스킹해 내려준다. */
    phoneMasked?: string;
    address?: string;
  };
  payment: {
    /** 상품 금액 · 쿠폰 할인 · 포인트 사용 · 배송비. 시안 순서를 그대로 따른다. */
    lines: OrderPaymentLine[];
    total: number;
    /** 결제수단 표기. 시안 `카드결제`. 결제수단이 연결되지 않은 주문은 비어 온다. */
    method?: string;
  };
}
