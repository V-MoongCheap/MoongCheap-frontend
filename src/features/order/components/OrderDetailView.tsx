'use client';

import { ERROR_ACTION_CLASS, ErrorScreen } from '@/components/ui/ErrorScreen';
import { GoBackButton } from '@/components/ui/GoBackButton';
import { ERROR_SCREEN_RETRY_LABEL } from '@/constants/commonMessages';
import { useOrderDetail } from '@/features/order/hooks/useOrders';
import { ApiError } from '@/lib/api';
import { ORDER_ERROR_CODE } from '@/types/api/order';

import { OrderDetail } from './OrderDetail';
import { OrderDetailSkeleton } from './OrderSkeleton';

// B-28 주문상세 본문. 페이지(서버 컴포넌트)는 앱바만 조립하고 데이터는 여기서 가져온다.
//
// 조회가 클라이언트인 이유는 `lib/orderApi.ts` 주석 참고(SID httpOnly 쿠키는 브라우저만 갖고 있다).
//
// 없는 주문 · 남의 주문(404 `ORDER_001`)은 루트 404(`app/not-found.tsx`)와 같은 화면을 그린다.
// `notFound()`를 부르지 않는 이유는 Next 16 문서가 그 사용처를 서버 컴포넌트 · 서버 함수 · 라우트
// 핸들러로 적고 있기 때문이다. 이 조회는 브라우저에서 끝난다.
//
// ⚠️ 로딩 · 조회 실패는 시안이 없다. 목록(`OrderList`)과 같은 방침으로 공용 컴포넌트를 재사용한다.

interface OrderDetailViewProps {
  /** 백엔드 주문번호(`ORD_` + UUID). 라우트 파라미터를 그대로 받는다. */
  orderNo: string;
}

export function OrderDetailView({ orderNo }: OrderDetailViewProps) {
  const { data, error, refetch } = useOrderDetail(orderNo);

  if (error !== null) {
    if (error instanceof ApiError && error.code === ORDER_ERROR_CODE.notFound) {
      return (
        <ErrorScreen>
          <GoBackButton className={ERROR_ACTION_CLASS}>{ERROR_SCREEN_RETRY_LABEL}</GoBackButton>
        </ErrorScreen>
      );
    }

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
