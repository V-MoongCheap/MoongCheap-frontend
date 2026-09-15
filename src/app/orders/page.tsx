import type { Metadata } from 'next';

import { AppBar } from '@/components/layout/AppBar';
import { OrderList } from '@/features/order/components/OrderList';

export const metadata: Metadata = {
  title: '주문 내역',
};

// B-21 주문 내역(FN-B21-01). 마이페이지 '진행중인 주문내역 > 자세히보기'에서 진입한다.
//
// 페이지는 앱바만 조립하고 조회 · 탭 · 무한 스크롤은 OrderList(client)가 맡는다. 조회를 서버에서 하지
// 않는 이유는 세션이 SID httpOnly 쿠키라 브라우저만 갖고 있기 때문이다(`lib/orderApi.ts`).
//
// backHref는 /mypage로 고정한다(명세: 헤더 백버튼 → B-26으로 복귀).
export default function OrdersPage() {
  return (
    <main className="flex w-full flex-1 flex-col">
      <AppBar backHref="/mypage" title="주문 내역" />
      <OrderList detailHrefBase="/orders" />
    </main>
  );
}
