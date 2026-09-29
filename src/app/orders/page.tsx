import { Suspense } from 'react';

import type { Metadata } from 'next';

import { AppBar } from '@/components/layout/AppBar';
import { OrderList } from '@/features/order/components/OrderList';
import { OrderListSkeleton } from '@/features/order/components/OrderSkeleton';

export const metadata: Metadata = {
  title: '주문 내역',
};

// B-21 주문 내역(FN-B21-01). 마이페이지 '진행중인 주문내역 > 자세히보기'와 진행 단계 숫자에서 진입한다.
//
// 페이지는 앱바만 조립하고 조회 · 탭 · 무한 스크롤은 OrderList(client)가 맡는다. 조회를 서버에서 하지
// 않는 이유는 세션이 SID httpOnly 쿠키라 브라우저만 갖고 있기 때문이다(`lib/orderApi.ts`).
//
// OrderList는 첫 탭을 주소의 `?tab=`에서 읽는다(`useSearchParams`, #199). 정적 렌더에서는 주소를 모르므로
// Suspense 경계로 감싸 첫 HTML에는 첫 조회 때와 같은 자리표시자를 둔다. 페이지는 정적 그대로라
// 마이페이지에서 넘어올 때 서버 응답을 기다리지 않는다.
//
// backHref는 /mypage로 고정한다(명세: 헤더 백버튼 → B-26으로 복귀).
export default function OrdersPage() {
  return (
    <main className="flex w-full flex-1 flex-col">
      <AppBar backHref="/mypage" title="주문 내역" />
      <Suspense fallback={<OrderListSkeleton withHeader />}>
        <OrderList detailHrefBase="/orders" />
      </Suspense>
    </main>
  );
}
