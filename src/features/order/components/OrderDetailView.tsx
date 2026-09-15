'use client';

import { ERROR_ACTION_CLASS, ErrorScreen } from '@/components/ui/ErrorScreen';
import { ERROR_SCREEN_RETRY_LABEL } from '@/constants/commonMessages';
import { useOrderDetail } from '@/features/order/hooks/useOrders';

import { OrderDetail } from './OrderDetail';
import { OrderDetailSkeleton } from './OrderSkeleton';

// B-28 주문상세 본문. 페이지(서버 컴포넌트)는 앱바만 조립하고 데이터는 여기서 가져온다.
//
// 조회가 클라이언트인 이유는 `lib/orderApi.ts` 주석 참고(SID httpOnly 쿠키는 브라우저만 갖고 있다).
//
// 조회가 실패하면 없는 주문 · 남의 주문(404 `ORDER_001`)까지 전부 같은 오류 화면을 그리고, 버튼은
// 다시 조회한다. 버튼 문구가 시안의 `다시 시도` 하나뿐이라, 404만 다른 동작(뒤로 가기 등)을 주면
// 라벨과 동작이 어긋난다. 이동 문구는 시안에 없어 만들지 않았다. 화면을 벗어나는 길은 페이지 앱바의
// 뒤로가기(`/orders`)가 맡는다.
//
// ⚠️ 로딩 · 조회 실패는 시안이 없다. 목록(`OrderList`)과 같은 방침으로 공용 컴포넌트를 재사용한다.

interface OrderDetailViewProps {
  /** 백엔드 주문번호(`ORD_` + UUID). 라우트 파라미터를 그대로 받는다. */
  orderNo: string;
}

export function OrderDetailView({ orderNo }: OrderDetailViewProps) {
  const { data, error, refetch } = useOrderDetail(orderNo);

  if (error !== null) {
    return (
      <ErrorScreen>
        <button className={ERROR_ACTION_CLASS} onClick={() => void refetch()} type="button">
          {ERROR_SCREEN_RETRY_LABEL}
        </button>
      </ErrorScreen>
    );
  }

  if (data === undefined) {
    return <OrderDetailSkeleton />;
  }

  return <OrderDetail order={data} />;
}
