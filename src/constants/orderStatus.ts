import { canTransition } from '@/lib/statusTransition';
import type { StatusMeta } from '@/types/status';
import type { OrderProgressStatus } from '@/types/user';

/**
 * 주문 상태 레지스트리. 화면 B-21(주문 내역)·B-26(마이페이지 요약)·B-28(주문 상세)이 참조한다.
 *
 * 출처: 기능정의서 '상태정의' 시트 — 주문 상태(B-21). 상태값·라벨·전이·비고를 옮겼다.
 *
 * 2026-08-27 백엔드 ERD 논의로 주문과 결제의 순서가 뒤집혔다.
 *   [전] 참여 → 결제 → 주문 생성            (스캐폴드 초안이 따르던 모델)
 *   [후] 참여 → 낙찰 판정 → 주문 생성 → 48h 유예 → 일괄 자동결제 → 배송지 입력
 *
 * 주문 레코드는 공구가 GB_CLOSED에 도달하는 **낙찰 시점**에 `PAYMENT_PENDING`(결제대기)으로
 * 생성되고, 결제는 48시간 뒤 자동 실행된다. 그래서 초안의 선두 상태였던 '결제완료'가 아니라
 * `PAYMENT_PENDING`이 맨 앞이며, 실제로는 가장 많은 주문이 이 단계에 머문다(상태정의 ★ 연결 지점).
 *
 * 정방향 진행이 원칙이며 CANCELED만 예외 분기다. DELIVERY_REQUESTED("배송요청")는 되돌아갈 수 없는
 * 지점으로, 진입 후 수량 변경이 불가능하다(여분 구매 마감선).
 *
 * 2026-09-15 백엔드 develop의 `OrderStatus`(10종)를 확인했다. 이름이 다른 상태는 레지스트리 키를
 * 바꾸지 않고 `lib/orderApi.ts`가 옮긴다(화면 타입은 API 계층에서 변환한다는 `types/order.ts` 원칙).
 *
 * ⚠️ 두 목록이 서로 맞지 않는다.
 *    - `DELIVERY_REQUESTED`(배송요청)는 백엔드에 없다. 응답에 나오지 않지만 마이페이지 요약 단계
 *      (`ORDER_PROGRESS_STEPS`)가 쓰고 있어 지우지 않는다
 *    - 결제실패·환불처리중·환불완료 3종은 백엔드에만 있다. 응답에 나오면 화면이 죽으므로 아래에
 *      추가했다. 라벨은 백엔드 enum 주석(`결제 실패` · `환불 처리 중` · `환불 완료`)에서 가져와 이
 *      레지스트리의 표기(띄어 쓰지 않음)에 맞췄다. 상태정의 시트에 없는 상태라 잠정이다
 */
export const ORDER_STATUS = {
  /** 결제대기 — 낙찰(GB_CLOSED)로 주문 레코드 생성. 48h 유예 뒤 자동결제 대기. 대부분의 주문이 머무는 단계. */
  PAYMENT_PENDING: {
    label: '결제대기',
    tone: 'brand',
    isTerminal: false,
    next: ['PAYMENT_COMPLETED', 'CANCELED'],
  },
  /** 결제완료 — 자동결제 성공. ★ 이 구간에 여분(바로) 구매 오픈. */
  PAYMENT_COMPLETED: {
    label: '결제완료',
    tone: 'brand',
    isTerminal: false,
    next: ['DELIVERY_REQUESTED', 'CANCELED'],
  },
  /** 배송요청 — 여분 판매 마감 + 최종 수량을 판매자에게 전달. 되돌아갈 수 없는 지점(수량 변경 불가). */
  DELIVERY_REQUESTED: {
    label: '배송요청',
    tone: 'info',
    isTerminal: false,
    next: ['PREPARING'],
  },
  /** 배송준비중 — 판매자 발주 확인 및 출고 준비 착수. */
  PREPARING: {
    label: '배송준비중',
    tone: 'info',
    isTerminal: false,
    next: ['SHIPPING'],
  },
  /** 배송중 — 송장 등록 및 집화 완료. 배송 조회(FN-B22-01) 가능. */
  SHIPPING: {
    label: '배송중',
    tone: 'info',
    isTerminal: false,
    next: ['DELIVERED'],
  },
  /** 배송완료 — 택배사 배송완료 처리. 이 상태에서만 '구매 확정' 버튼을 노출한다. */
  DELIVERED: {
    label: '배송완료',
    tone: 'success',
    isTerminal: false,
    next: ['PURCHASE_CONFIRMED'],
  },
  /** 구매확정 — 사용자 수령 확인 또는 배송완료 후 7일 경과 시 자동 확정(AUTO_CONFIRM_DAYS). */
  PURCHASE_CONFIRMED: {
    label: '구매확정',
    tone: 'success',
    isTerminal: true,
    next: [],
  },
  /**
   * 결제실패 - 백엔드에만 있는 상태(`PAYMENT_FAILED`). 다음 전이가 명세에 없어 비워 둔다.
   * 결제수단을 바꿔야 하는 상황일 수 있어 '사용자 조치 필요' 톤으로 둔다.
   */
  PAYMENT_FAILED: {
    label: '결제실패',
    tone: 'warning',
    isTerminal: false,
    next: [],
  },
  /** 환불처리중 - 백엔드에만 있는 상태(`REFUND_PENDING`). */
  REFUND_PENDING: {
    label: '환불처리중',
    tone: 'info',
    isTerminal: false,
    next: ['REFUNDED'],
  },
  /** 환불완료 - 백엔드에만 있는 상태(`REFUNDED`). */
  REFUNDED: {
    label: '환불완료',
    tone: 'neutral',
    isTerminal: true,
    next: [],
  },
  /** 취소/교환/반품 — 사용자 취소 요청 또는 판매자 취소. B-26에서 별도 버튼으로 분리 진입(로직 미구현). */
  CANCELED: {
    label: '취소/교환/반품',
    tone: 'neutral',
    isTerminal: true,
    next: [],
  },
} as const satisfies Record<string, StatusMeta<string>>;

/** 주문 상태 코드 유니온. 레지스트리 키에서 파생하므로 상수와 항상 일치한다. */
export type OrderStatus = keyof typeof ORDER_STATUS;

/**
 * B-26 마이페이지 "진행중인 주문내역" 요약이 노출하는 진행 단계(정방향 진행 순).
 *
 * 종료 계열(PURCHASE_CONFIRMED·CANCELED)은 "진행중"이 아니므로 요약 배열에서 제외한다.
 * `OrderProgressStatus`(types/user)로 타입을 고정해, 레지스트리와 단계 목록이 어긋나면
 * 컴파일 단계에서 걸린다.
 */
export const ORDER_PROGRESS_STEPS = [
  'PAYMENT_COMPLETED',
  'DELIVERY_REQUESTED',
  'PREPARING',
  'SHIPPING',
  'DELIVERED',
] as const satisfies readonly OrderProgressStatus[];

/**
 * 진행 단계 라벨 맵. 레지스트리 메타에서 파생하므로 라벨 단일 출처가 유지된다.
 * `Record<OrderProgressStatus, string>` 제약으로 5단계가 모두 레지스트리에 존재함을 보장한다.
 */
export const ORDER_PROGRESS_LABELS: Record<OrderProgressStatus, string> = {
  PAYMENT_COMPLETED: ORDER_STATUS.PAYMENT_COMPLETED.label,
  DELIVERY_REQUESTED: ORDER_STATUS.DELIVERY_REQUESTED.label,
  PREPARING: ORDER_STATUS.PREPARING.label,
  SHIPPING: ORDER_STATUS.SHIPPING.label,
  DELIVERED: ORDER_STATUS.DELIVERED.label,
};

/** 상태 코드로 메타(라벨·톤·전이)를 얻는다. */
export function getOrderStatusMeta(status: OrderStatus) {
  return ORDER_STATUS[status];
}

/** from → to 전이가 상태 그래프상 허용되는지 검사한다(범용 canTransition 위임). */
export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  return canTransition(ORDER_STATUS, from, to);
}

/**
 * B-21 주문 내역의 상태 탭.
 *
 * ⚠️ 시안(`818:35719`)은 `전체 / 배송 준비중 / 완료` 3종인데, **어떤 상태를 묶는지가 없다.**
 *    기능명세 `FN-B21-01`만 매핑을 정의하고 있어 명세의 4종을 따른다(2026-09-04 결정).
 *    시안이 4탭으로 갱신되면 라벨만 맞추면 된다.
 *
 * **탭이 어떤 상태를 묶는지는 서버가 정한다.** `GET /api/orders/list?tab=`으로 거른 결과를 받는다
 * (탭 키 → 백엔드 값 변환은 `lib/orderApi.ts`). 2026-09-15 백엔드 `OrderService.viewOrderList`를
 * 확인한 결과는 아래와 같고, 명세 4종과 같다.
 *
 *   진행중    결제대기 · 결제완료 · 배송준비중 · 배송중
 *   배송완료  배송완료
 *   완료      구매확정
 *
 * 결제대기를 '진행중'에 넣은 것은 원래 PM 확인 대상으로 남긴 프론트 판단이었는데 백엔드도 같다.
 * 취소·결제실패·환불 계열은 어느 탭에도 없고 '전체'에서만 보인다.
 */
export const ORDER_LIST_TABS = [
  { key: 'all', label: '전체' },
  { key: 'inProgress', label: '진행중' },
  { key: 'delivered', label: '배송완료' },
  { key: 'confirmed', label: '완료' },
] as const satisfies readonly { key: string; label: string }[];

/** 탭 키 유니온. 탭 정의에서 파생하므로 상수와 항상 일치한다. */
export type OrderListTabKey = (typeof ORDER_LIST_TABS)[number]['key'];
