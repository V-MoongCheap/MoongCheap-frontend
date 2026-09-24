'use client';

import { useState } from 'react';

import { ChevronRight, Search } from 'lucide-react';
import Link from 'next/link';

import { ComingSoonButton } from '@/components/ui/ComingSoonButton';
import { ERROR_ACTION_CLASS, ErrorScreen } from '@/components/ui/ErrorScreen';
import { ErrorState } from '@/components/ui/ErrorState';
import { ERROR_SCREEN_RETRY_LABEL } from '@/constants/commonMessages';
import { ORDER_LIST_TABS, type OrderListTabKey } from '@/constants/orderStatus';
import { useRedirectOnUnauthorized } from '@/features/auth/session';
import { useOrderList } from '@/features/order/hooks/useOrders';
import { useInfiniteScrollSentinel } from '@/hooks/useInfiniteScrollSentinel';
import { cn } from '@/lib/cn';

import { OrderCard } from './OrderCard';
import { OrderListEmpty } from './OrderListEmpty';
import { OrderCardSkeleton, OrderListSkeleton } from './OrderSkeleton';

// B-21 주문 내역 목록. 시안 `818:35719`(목록) · `453:26371`(빈 상태).
//
// 조회가 클라이언트인 이유는 `lib/orderApi.ts` 주석 참고(SID httpOnly 쿠키는 브라우저만 갖고 있다).
// 탭은 서버가 거른다. 탭마다 캐시 키가 달라 탭을 오가도 받은 목록을 바로 다시 받지 않는다.
//
// ⚠️ 첫 로딩 · 조회 실패 · 추가 로딩 · 추가 로딩 실패는 시안이 없다(명세 `🖌️ 디자인 필요`). 배송지 목록과
//    같은 방침으로 새로 그리지 않고 공용 `ErrorScreen` · `ErrorState` · `Skeleton`을 재사용한다.
//
// 시안에 없어 명세를 따른 것 · 명세에 없어 시안을 따른 것은 각 지점에 주석으로 표시했다.

/** 시안 탭: 높이 36 · label-14. 선택된 칸만 흰 배경 + radius 8. */
const TAB_CLASS = 'text-label-14 flex h-9 flex-1 items-center justify-center p-2.5';

interface OrderListProps {
  /**
   * 상세 경로의 앞부분. 카드 링크는 여기에 `/{주문번호}`를 붙인다. 라우트는 호출부(page)가 정한다.
   *
   * 경로를 만드는 **함수**로 받으면 안 된다. 호출부가 서버 컴포넌트라 함수는 클라이언트 경계를
   * 넘지 못한다.
   */
  detailHrefBase: string;
}

export function OrderList({ detailHrefBase }: OrderListProps) {
  const [tab, setTab] = useState<OrderListTabKey>('all');
  const {
    data,
    error,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useOrderList(tab);
  // 세션 만료(401)는 재시도해도 소용없어 오류 화면 대신 로그인 화면으로 보낸다(#159).
  const isRedirectingToLogin = useRedirectOnUnauthorized(error);

  // 목록 끝이 화면에 가까워지면 다음 20건을 받는다(`BR-B21-01-11`). 이어 받기가 실패하면 감지를
  // 멈추고 목록 아래 재시도 버튼을 기다린다. 감지 로직은 참여 목록과 공유한다
  // (`useInfiniteScrollSentinel`).
  const canLoadMore = hasNextPage && !isFetchingNextPage && !isFetchNextPageError;
  const sentinelRef = useInfiniteScrollSentinel(canLoadMore, fetchNextPage);

  // 첫 조회 실패. 이어 받기 실패는 받은 목록을 지우지 않고 목록 아래에서 따로 알린다.
  // 401로 로그인 화면에 보내는 동안은 아래 스켈레톤을 유지한다(깜빡임 방지).
  if (data === undefined && isError && !isRedirectingToLogin) {
    return (
      <ErrorScreen>
        <button className={ERROR_ACTION_CLASS} onClick={() => void refetch()} type="button">
          {ERROR_SCREEN_RETRY_LABEL}
        </button>
      </ErrorScreen>
    );
  }

  const header = (
    <div className="flex w-full flex-col gap-2 px-4 pt-3.25">
      {/* 탭. 시안은 3칸(전체·배송 준비중·완료)인데 어떤 상태를 묶는지가 없어, 매핑이 정의된
          명세 4종을 따랐다(constants/orderStatus.ts ORDER_LIST_TABS 주석 참고). */}
      <div
        className="bg-surface-button-quarternary-hover rounded-12 flex w-full items-center justify-between p-1"
        role="tablist"
      >
        {ORDER_LIST_TABS.map((item) => {
          const selected = item.key === tab;
          return (
            <button
              aria-selected={selected}
              className={cn(
                TAB_CLASS,
                selected
                  ? 'bg-background-default rounded-8 text-content-primary'
                  : 'rounded-4 text-content-tertiary',
              )}
              key={item.key}
              onClick={() => setTab(item.key)}
              role="tab"
              type="button"
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* 검색은 MVP 미포함이다(`BR-B21-01-10`). 시안에 있으니 그리고 동작만 막는다. */}
      <ComingSoonButton className="bg-surface-button-quarternary-hover rounded-24 text-label-12 text-content-disabled-primary flex h-8.5 w-full items-center justify-between px-3 py-2">
        구매한 상품/스토어/브랜드를 검색해보세요
        <Search aria-hidden className="size-5" />
      </ComingSoonButton>
    </div>
  );

  // 첫 조회 중. '전체' 탭은 주문이 0건이면 탭이 통째로 사라지므로(빈 상태 시안) 결과를 알기 전에
  // 진짜 탭을 그리지 않는다. 다른 탭은 이미 탭이 보이는 상태에서 넘어온 것이라 탭을 유지한다.
  if (data === undefined) {
    if (tab === 'all') {
      return <OrderListSkeleton withHeader />;
    }
    return (
      <div className="flex w-full flex-1 flex-col">
        {header}
        <OrderListSkeleton />
      </div>
    );
  }

  const orders = data.pages.flatMap((page) => page.orders);

  // 주문이 하나도 없으면 시안(453:26371)대로 탭·검색을 감추고 빈 상태만 보여 준다.
  // '전체' 탭 결과로만 판단한다. 다른 탭의 0건은 그 탭에 해당하는 주문이 없다는 뜻일 뿐이다.
  if (tab === 'all' && orders.length === 0) {
    return (
      <OrderListEmpty
        action={
          // '공구 하러가기'의 목적지가 시안에 없고, 공구 목록 화면도 아직 없다.
          <ComingSoonButton className="bg-surface-button-tertiary-default text-content-inverse text-button-14 rounded-20 flex h-10 w-32.75 items-center justify-center px-3">
            공구 하러가기
          </ComingSoonButton>
        }
      />
    );
  }

  return (
    <div className="flex w-full flex-1 flex-col">
      {header}

      {orders.length === 0 ? (
        // 탭별 빈 목록은 시안이 없다(명세 `🖌️ 디자인 필요` 2번). 전체 빈 상태의 문구를 그대로
        // 쓰고 CTA는 뺐다. 탭 문구가 확정되면 여기만 고친다.
        <OrderListEmpty />
      ) : (
        <>
          <ol className="flex w-full flex-col gap-2 pt-2">
            {orders.map((order) => (
              <li className="flex w-full flex-col gap-1" key={order.id}>
                <div className="flex w-full items-center justify-between px-4 py-2">
                  <p className="text-label-16 text-content-primary">{order.orderedAt}</p>
                  <Link
                    className="text-caption-12 text-content-primary flex shrink-0 items-center gap-0.5"
                    href={`${detailHrefBase}/${encodeURIComponent(order.id)}`}
                  >
                    주문상세
                    <ChevronRight aria-hidden className="size-4.5" />
                  </Link>
                </div>

                <div className="w-full px-4">
                  <OrderCard order={order} />
                </div>
              </li>
            ))}
          </ol>

          {isFetchingNextPage && (
            <div aria-busy className="pt-2" role="status">
              <span className="sr-only">주문 내역을 불러오는 중</span>
              <OrderCardSkeleton />
            </div>
          )}

          {isFetchNextPageError && (
            // 이어 받기 실패. 받은 목록은 그대로 두고 목록 아래에서 다시 받게 한다(인라인 오류, FN-B03-01).
            <ErrorState onRetry={() => void fetchNextPage()} />
          )}

          {/* 다음 페이지 감지용 표식. 높이가 없어 보이지 않는다. */}
          <div aria-hidden ref={sentinelRef} />
        </>
      )}
    </div>
  );
}
