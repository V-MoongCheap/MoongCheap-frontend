import { LIST_PAGE_SIZE } from '@/constants/businessRules';
import type { OrderListTabKey, OrderStatus } from '@/constants/orderStatus';
import type {
  OrderDetailResponseDto,
  OrderListResponseDto,
  OrderListTabDto,
  OrderStatusDto,
  PageDto,
} from '@/types/api/order';
import type { OrderDetail, OrderItem, OrderListPage, OrderSummary } from '@/types/order';

import { apiFetch } from './api';

/**
 * 주문(B-21 주문 내역 · B-28 주문상세) 백엔드 호출.
 *
 * `lib/addressApi.ts`와 같은 규칙이다. 화면은 백엔드 DTO를 모르고 `types/order.ts`만 안다. 변환은
 * 전부 이 파일이 맡는다.
 *
 * 세션이 SID httpOnly 쿠키라 **브라우저에서만** 부른다. 서버 컴포넌트에서 부르면 쿠키 없이 나가 401이
 * 된다(`features/user/hooks/useAddresses.ts`와 같은 이유).
 *
 * ⚠️ 주문 API는 백엔드 develop 브랜치에만 있다(2026-09-15). 로컬 백엔드를 develop으로 띄워야 한다.
 */

/**
 * 백엔드 상태 → 화면 레지스트리 키.
 *
 * 이름이 다른 것은 셋이다. `PREPARING_SHIPMENT` → `PREPARING`, `SHIPPED` → `SHIPPING`,
 * `COMPLEDED`(오타로 보임) → `PURCHASE_CONFIRMED`. 레지스트리의 `DELIVERY_REQUESTED`(배송요청)는
 * 백엔드에 대응하는 상태가 없어 이 표에 나오지 않는다.
 *
 * `Record`라 `OrderStatusDto`에 상태를 더하면 여기서 컴파일이 깨진다.
 */
const STATUS_FROM_DTO: Record<OrderStatusDto, OrderStatus> = {
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  PAYMENT_COMPLETED: 'PAYMENT_COMPLETED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PREPARING_SHIPMENT: 'PREPARING',
  SHIPPED: 'SHIPPING',
  DELIVERED: 'DELIVERED',
  COMPLEDED: 'PURCHASE_CONFIRMED',
  CANCELED: 'CANCELED',
  REFUND_PENDING: 'REFUND_PENDING',
  REFUNDED: 'REFUNDED',
};

/**
 * 응답의 상태 문자열을 레지스트리 키로 옮긴다. 표에 없는 값이면 `undefined`다.
 *
 * 응답은 타입 단언만 거쳐 들어오므로 `OrderStatusDto`에 없는 상태도 실제로 올 수 있다. 표를 그대로
 * 조회하면 `undefined`가 카드까지 가서 상태 라벨을 읽다가 목록 전체가 죽는다. 여기서 걸러 그 주문의
 * 상태만 비운다(`OrderSummary.status` 주석).
 *
 * `in` 대신 자기 속성만 보는 이유는 `toString` 같은 상속 속성 이름이 통과하지 않게 하기 위해서다.
 */
function toOrderStatus(value: string): OrderStatus | undefined {
  if (!Object.prototype.hasOwnProperty.call(STATUS_FROM_DTO, value)) {
    return undefined;
  }
  return STATUS_FROM_DTO[value as OrderStatusDto];
}

/** 화면 탭 → 백엔드 탭. 탭이 어떤 상태를 묶는지는 서버가 정한다(`ORDER_LIST_TABS` 주석). */
const TAB_TO_DTO: Record<OrderListTabKey, OrderListTabDto> = {
  all: 'ALL',
  inProgress: 'IN_PROGRESS',
  delivered: 'DELIVERED',
  confirmed: 'COMPLETED',
};

/**
 * `2026-08-28` → 시안 표기 `26.08.28`.
 *
 * 모양이 다르면 받은 값을 그대로 쓴다. 날짜 표기가 어긋나는 것보다 화면이 죽는 것이 더 나쁘다.
 */
function formatOrderDate(isoDate: string): string {
  const match = /^\d{2}(\d{2})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (match === null) {
    return isoDate;
  }
  const [, year, month, day] = match;
  return `${year}.${month}.${day}`;
}

/**
 * 수량 표기.
 *
 * ⚠️ 시안은 `1박스`처럼 상품 단위를 붙이는데 응답에는 숫자만 온다. 단위를 알 수 없어 `개`로 적는다.
 *    단위 필드는 백엔드 문의 대상이다(#94).
 */
function formatQuantity(quantity: number): string {
  return `${quantity}개`;
}

/**
 * 상품 한 줄. 응답이 주문 1건 = 상품 1개라 화면의 `items`는 항상 한 칸짜리 배열이 된다.
 * 줄을 따로 가리킬 id가 없어 주문번호를 그대로 쓴다.
 */
function toItem(values: {
  orderNo: string;
  name: string;
  quantity: number;
  price: number;
  imageUrl: string | null;
}): OrderItem {
  return {
    id: values.orderNo,
    name: values.name,
    quantity: formatQuantity(values.quantity),
    price: values.price,
    imageUrl: values.imageUrl ?? undefined,
  };
}

/**
 * 목록 한 건을 카드 모양으로 옮긴다.
 *
 * ⚠️ 카드 금액이 목록과 상세에서 다르다. 목록 응답에는 배송비를 포함한 총액(`totalAmount`)뿐이라
 *    그것을 쓴다. 상세 카드는 시안대로 상품 금액(배송비 제외)을 쓴다. 목록에 상품 금액이 오면 맞춘다.
 */
function toOrderSummary(dto: OrderListResponseDto): OrderSummary {
  return {
    id: dto.orderNo,
    orderedAt: formatOrderDate(dto.orderDate),
    sellerName: dto.businessName,
    status: toOrderStatus(dto.orderStatus),
    items: [
      toItem({
        orderNo: dto.orderNo,
        name: dto.productName,
        quantity: dto.quantity,
        price: dto.totalAmount,
        imageUrl: dto.imageUrl,
      }),
    ],
  };
}

/**
 * 상세 응답을 화면 모양으로 옮긴다.
 *
 * - 카드 금액은 `payment.productAmount`(단가 × 수량)다. `product.productAmount`는 이름과 달리 단가라
 *   시안의 카드 금액(= 결제내역의 상품 금액)과 맞지 않는다
 * - 결제일(`paidAt`)은 응답에 없어 채우지 않는다. 화면이 주문일자로 대신한다
 * - 결제내역 줄은 응답에 있는 두 항목(상품 금액 · 배송비)만 만든다. 시안의 쿠폰 할인 · 포인트 사용은
 *   응답에 없고 기능명세 `FN-B28-01`에도 없다
 */
function toOrderDetail(dto: OrderDetailResponseDto): OrderDetail {
  const { product, shipping, payment } = dto;

  return {
    id: dto.orderNo,
    orderedAt: formatOrderDate(dto.orderDate),
    sellerName: product.businessName,
    status: toOrderStatus(product.orderStatus),
    items: [
      toItem({
        orderNo: dto.orderNo,
        name: product.productName,
        quantity: product.quantity,
        price: payment.productAmount,
        imageUrl: product.imageUrl,
      }),
    ],
    orderNumber: dto.orderNo,
    shipping: {
      recipient: shipping.recipientNameMasked ?? undefined,
      phoneMasked: shipping.phoneNumberMasked ?? undefined,
      address: shipping.addressMasked ?? undefined,
    },
    payment: {
      // 라벨은 시안(`453:25878`) 문구다.
      lines: [
        { label: '상품 금액', amount: payment.productAmount },
        { label: '배송비', amount: payment.deliveryFee },
      ],
      total: payment.totalPaymentAmount,
      method: payment.paymentMethod ?? undefined,
    },
  };
}

/**
 * 주문 목록 한 페이지. 최근 주문이 먼저 온다(백엔드 기본 정렬 `createdAt DESC`).
 *
 * `size`는 목록 공통 `LIST_PAGE_SIZE`(20)다. 백엔드 `max-page-size`도 20이라 더 크게 보내도 20건이다.
 *
 * `GET /api/orders/list?tab=&page=&size=`
 */
export async function getOrders(tab: OrderListTabKey, page: number): Promise<OrderListPage> {
  const params = new URLSearchParams({
    tab: TAB_TO_DTO[tab],
    page: String(page),
    size: String(LIST_PAGE_SIZE),
  });
  const response = await apiFetch(`/api/orders/list?${params.toString()}`);
  const body = (await response.json()) as PageDto<OrderListResponseDto>;

  return {
    orders: body.content.map(toOrderSummary),
    page: body.number,
    hasNext: !body.last,
  };
}

/**
 * 주문 상세. 없는 주문과 남의 주문은 둘 다 404 `ORDER_001`로 온다. 조회가 주문번호 + 회원 id로 걸려
 * 있어서다. 화면은 다른 조회 실패와 같이 다룬다(`OrderDetailView` 주석).
 *
 * `GET /api/orders/{orderNo}`
 */
export async function getOrderDetail(orderNo: string): Promise<OrderDetail> {
  const response = await apiFetch(`/api/orders/${encodeURIComponent(orderNo)}`);
  const dto = (await response.json()) as OrderDetailResponseDto;
  return toOrderDetail(dto);
}
