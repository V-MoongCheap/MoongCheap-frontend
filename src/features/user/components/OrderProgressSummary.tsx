import Link from 'next/link';

import {
  ORDER_PROGRESS_LABELS,
  ORDER_PROGRESS_STEPS,
  ORDER_PROGRESS_TABS,
} from '@/constants/orderStatus';
import { cn } from '@/lib/cn';
import type { OrderProgressCounts } from '@/types/user';

// 진행중인 주문 단계별 건수. 단계 목록은 `constants/orderStatus.ts`(ORDER_PROGRESS_STEPS)가 갖는다.
// 2026-09-15 Figma 최종본에 맞춰 결제완료~배송완료 5단계로 확정(결제대기 제외). 단계가 바뀌면 상수만 고친다.
//
// 단계를 누르면 그 단계가 속한 탭으로 주문 내역(B-21)을 연다(TC-B21-01-03, #199). 0건 단계도 같다.
// 빈 탭이 열릴 뿐이고, 누르는 자리가 건수에 따라 바뀌지 않는다.

interface OrderProgressSummaryProps {
  counts: OrderProgressCounts;
  /** 주문 내역(B-21) 경로. 여기에 `?tab=`을 붙인다. 라우트는 호출부(page)가 정한다. */
  ordersHref: string;
}

export function OrderProgressSummary({ counts, ordersHref }: OrderProgressSummaryProps) {
  return (
    <ol className="flex w-full items-center justify-between p-4">
      {ORDER_PROGRESS_STEPS.map((status) => {
        const count = counts[status];

        return (
          <li className="w-11.5" key={status}>
            <Link
              className="flex w-full flex-col items-center gap-[3px]"
              href={`${ordersHref}?tab=${ORDER_PROGRESS_TABS[status]}`}
            >
              {/* 0건과 1건 이상을 색으로 구분한다. 시안에서 진행 중인 단계만 브랜드 색이다. */}
              <span
                className={cn(
                  'text-heading-24 flex h-11.5 w-full items-center justify-center',
                  count > 0 ? 'text-content-brand' : 'text-content-secondary',
                )}
              >
                {count}
              </span>
              <span className="text-caption-10 text-content-secondary w-full text-center">
                {ORDER_PROGRESS_LABELS[status]}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
