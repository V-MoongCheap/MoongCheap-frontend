'use client';

import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { ORDER_PROGRESS_STEPS } from '@/constants/orderStatus';
import { useOrderProgressCounts } from '@/features/order/hooks/useOrders';
import { OrderProgressSummary } from '@/features/user/components/OrderProgressSummary';

// 마이페이지(B-26) 진행 요약을 실 API로 그리는 client 컴포넌트. `SessionProfileCard`와 같은 방침이다.
//
// 세션이 SID httpOnly 쿠키라 서버 컴포넌트에서 부르면 쿠키 없이 나가 401이 된다(`lib/orderApi.ts`
// 주석). 그래서 `app/mypage/(hub)/page.tsx`는 서버 컴포넌트로 두고 요약 부분만 잘라 냈다.
// 조회 중·실패 상태는 `SessionOrderProgressSummary`가 직접 처리한다.
//
// 미로그인 이동은 `SessionOrderProgressSummary`가 하지 않는다. 같은 화면의 `SessionProfileCard`가
// 세션을 보고 로그인 화면으로 돌리므로, 둘이 같이 이동을 걸면 중복이 된다. 401도 다른 조회 실패와
// 같이 다룬다.

export function SessionOrderProgressSummary() {
  const { data, isPending, isError, refetch } = useOrderProgressCounts();

  if (isPending) {
    return <OrderProgressSummarySkeleton />;
  }

  if (isError || data === undefined) {
    // 요약 자리에만 재시도를 둔다. 아래 '취소/교환/반품 조회'와 설정 목록은 그대로 남는다.
    return <ErrorState className="py-6" onRetry={() => void refetch()} />;
  }

  return <OrderProgressSummary counts={data} />;
}

/** `OrderProgressSummary`와 같은 칸 수·크기의 자리표시자. 숫자 자리와 라벨 자리를 나눠 둔다. */
function OrderProgressSummarySkeleton() {
  return (
    <div className="flex w-full items-center justify-between p-4">
      {ORDER_PROGRESS_STEPS.map((status) => (
        <div className="flex w-11.5 flex-col items-center gap-[3px]" key={status}>
          <div className="flex h-11.5 w-full items-center justify-center">
            <Skeleton className="h-7 w-6" />
          </div>
          <Skeleton className="h-2.5 w-full" />
        </div>
      ))}
    </div>
  );
}
