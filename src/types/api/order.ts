/**
 * 주문 백엔드 DTO.
 *
 * `types/order.ts`(화면용)와 역할이 다르다. 여기는 **백엔드 응답을 그대로 옮긴 것**이고, 화면 타입으로의
 * 변환은 `lib/orderApi.ts`가 맡는다(`types/api/address.ts`와 같은 규칙).
 *
 * 출처: 백엔드 develop 브랜치 `OrderController` · `OrderService` · `OrderListResponse` ·
 * `OrderDetailResponse` · `OrderStatus`(2026-09-15 확인). 주문 API는 아직 main에 없다.
 *
 * ⚠️ `@Schema` 예시와 실제 record가 다르다. 예시에 있는 `groupBuy.targetCount`·`availableActions`는
 *    record에 없어 직렬화되지 않는다. 실제로 나가는 record를 따랐다.
 */

/**
 * 백엔드 주문 상태. 화면 레지스트리(`constants/orderStatus.ts`)와 이름이 달라 `lib/orderApi.ts`가 옮긴다.
 *
 * ⚠️ `COMPLEDED`는 `COMPLETED`의 오타로 보이지만 응답에 이 문자열 그대로 나간다. 백엔드 문의 대상이다(#94).
 */
export type OrderStatusDto =
  | 'PAYMENT_PENDING'
  | 'PAYMENT_COMPLETED'
  | 'PAYMENT_FAILED'
  | 'PREPARING_SHIPMENT'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLEDED'
  | 'CANCELED'
  | 'REFUND_PENDING'
  | 'REFUNDED';

/** `GET /api/orders/list`의 `tab` 파라미터. 생략하면 백엔드가 `ALL`로 본다. */
export type OrderListTabDto = 'ALL' | 'IN_PROGRESS' | 'DELIVERED' | 'COMPLETED';

/** `GET /api/orders/list` 목록의 한 건. **주문 1건 = 상품 1개**인 평평한 구조다. */
export interface OrderListResponseDto {
  /** `LocalDate`(`2026-08-28`). 주문 레코드 생성일이다. */
  orderDate: string;
  /** `ORD_` + UUID. 상세 조회 경로에 쓴다. */
  orderNo: string;
  /** 셀러 상호명. */
  businessName: string;
  orderStatus: OrderStatusDto;
  /** 외부 절대 URL이 온다. `next/image`에 넘기기 전에 걸러야 한다(`lib/imageSource`). */
  imageUrl: string | null;
  productName: string;
  /** 수량. 단위 없이 숫자만 온다. */
  quantity: number;
  /** 주문 금액. **배송비를 포함한 총액**이다(`Orders.totalAmount`). */
  totalAmount: number;
}

/**
 * 스프링 `Page` 직렬화 결과 중 이 앱이 읽는 필드만.
 *
 * 백엔드가 `PageImpl`을 그대로 반환한다(직렬화 모드 설정 없음). 스프링 데이터가 이 형태의 JSON 구조를
 * 버전 간에 보장하지 않는다고 경고하는 방식이라, 기대는 필드를 최소로 둔다.
 */
export interface PageDto<T> {
  content: T[];
  /** 현재 페이지 번호. **0부터**다(`one-indexed-parameters` 설정 없음). */
  number: number;
  /** 마지막 페이지인지. */
  last: boolean;
}

/** `GET /api/orders/{orderNo}` 응답. */
export interface OrderDetailResponseDto {
  orderDate: string;
  orderNo: string;
  product: {
    businessName: string;
    /** 지금은 백엔드가 `택배`로 고정해 보낸다. */
    deliveryType: string;
    deliveryFee: number;
    orderStatus: OrderStatusDto;
    imageUrl: string | null;
    productName: string;
    quantity: number;
    /**
     * ⚠️ 이름과 달리 **단가**다(`order.getPrice()`). 단가 × 수량은 `payment.productAmount`에 있다.
     */
    productAmount: number;
    groupBuy: { groupBuyId: number; title: string };
  };
  shipping: {
    /** ⚠️ 이름과 달리 마스킹되지 않은 원문이 온다(`order.getShippingName()`). */
    recipientNameMasked: string | null;
    /** 마스킹된 휴대폰 번호. 서버에서 복호화 후 마스킹한다. */
    phoneNumberMasked: string | null;
    /** ⚠️ 이름과 달리 마스킹되지 않은 원문이다. 주소가 없으면 null이다. */
    addressMasked: string | null;
  };
  payment: {
    /** 단가 × 수량. */
    productAmount: number;
    deliveryFee: number;
    totalPaymentAmount: number;
    /** `신한카드 ****-1234`처럼 사업자 + 마스킹 번호. 결제수단이 연결되지 않았으면 null이다. */
    paymentMethod: string | null;
  };
}

/**
 * 주문 비즈니스 에러 코드. 출처: 백엔드 `ErrorCode`.
 * 화면이 `ApiError.code`로 분기할 때 문자열을 직접 적지 않도록 모아 둔다.
 */
export const ORDER_ERROR_CODE = {
  /**
   * 404 주문을 찾을 수 없습니다. 조회가 주문번호 + 회원 id로 걸려 있어 **남의 주문도 같은 코드**다.
   * 같은 404라도 탈퇴 회원(`USER_001`)은 주문이 없는 것이 아니라 코드로 가른다.
   */
  notFound: 'ORDER_001',
} as const;
