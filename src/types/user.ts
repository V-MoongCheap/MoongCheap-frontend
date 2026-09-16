/**
 * 회원(마이페이지) 화면이 요구하는 타입.
 *
 * `types/auth.ts`와 같은 원칙이다. 백엔드 응답을 옮긴 것이 아니라 **화면이 필요로 하는 모양**이며,
 * 규격이 나오면 API 계층에서 변환해 이 타입으로 맞춘다.
 */

/**
 * 지금 쓰고 있는 역할. 구매자 화면이냐 판매자 화면이냐만 가른다.
 *
 * 같은 리터럴을 쓰는 다른 두 타입과 축이 다르다.
 * - `types/auth.ts`의 `UserRole`(CONSUMER·SELLER·ADMIN)은 백엔드 계정 권한이다. ADMIN은 이
 *   앱에 진입 자체가 없어 여기서는 두 값만 둔다.
 * - `constants/screens.ts`의 `ScreenRole`은 화면이 어느 카탈로그(B-* / S-*)에 속하는지다.
 *   사람의 역할이 아니라 화면 분류축이라 합치지 않는다.
 */
export type ActiveRole = 'buyer' | 'seller';

/**
 * 마이페이지 "진행중인 주문내역"의 진행 단계.
 *
 * `PAYMENT_PENDING`(결제대기)은 2026-08-27 구조 변경 때 잠정 포함했으나, 2026-09-15 Figma 최종본이
 * 결제완료부터 5단계로 확정돼 요약에서 제외한다. 주문 레코드는 여전히 낙찰 시점에 PAYMENT_PENDING으로
 * 생성되지만(가장 많은 주문이 머무는 단계), 이 마이페이지 요약(B-26)에는 노출하지 않는다 — 주문목록
 * (B-21) '진행중' 탭은 별개로 결제대기를 계속 포함한다(`constants/orderStatus.ts` ORDER_LIST_TABS).
 */
export type OrderProgressStatus =
  'PAYMENT_COMPLETED' | 'DELIVERY_REQUESTED' | 'PREPARING' | 'SHIPPING' | 'DELIVERED';

/** 단계별 주문 건수. 0건도 자리를 차지하므로 전 단계를 채운다. */
export type OrderProgressCounts = Record<OrderProgressStatus, number>;

/** 마이페이지 홈(B-26)이 한 번에 필요로 하는 데이터. */
export interface MyPageOverview {
  nickname: string;
  email: string;
  /** 프로필 카드의 전환 버튼 라벨과 전환 시트의 '현재상태' 표시를 가른다. */
  role: ActiveRole;
  orderProgress: OrderProgressCounts;
}
