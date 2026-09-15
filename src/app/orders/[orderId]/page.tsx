import type { Metadata } from 'next';

import { AppBar } from '@/components/layout/AppBar';
import { OrderDetailView } from '@/features/order/components/OrderDetailView';

export const metadata: Metadata = {
  title: '주문상세',
};

// B-28 주문상세(FN-B28-01). B-21 주문 내역의 '주문상세 >'에서 진입한다.
//
// 페이지는 앱바만 조립하고 조회는 OrderDetailView(client)가 맡는다(`lib/orderApi.ts`).
// backHref는 /orders로 고정한다(명세: 헤더 백버튼 → B-21로 복귀).
//
// 파라미터 이름은 `orderId`로 두었지만 값은 백엔드 주문번호(`ORD_` + UUID)다.
//
// 생성 타입(PageProps)은 `next build` 전에 존재하지 않아 typecheck에서 깨지므로 params를 직접
// 타이핑한다(app/layout.tsx와 같은 이유).
export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  return (
    <main className="flex w-full flex-1 flex-col">
      <AppBar backHref="/orders" title="주문상세" />
      <OrderDetailView orderNo={orderId} />
    </main>
  );
}
