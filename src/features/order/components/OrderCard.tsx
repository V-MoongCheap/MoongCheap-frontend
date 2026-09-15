import type { ReactNode } from 'react';

import Image from 'next/image';

import { ComingSoonButton } from '@/components/ui/ComingSoonButton';
import { getOrderStatusMeta } from '@/constants/orderStatus';
import { isRenderableImageSrc } from '@/lib/imageSource';
import type { OrderItem, OrderSummary } from '@/types/order';

// 주문 카드 한 장. B-21 목록(`818:35734`)과 B-28 주문상세(`453:25885`)가 같은 카드를 쓴다.
//
// 그룹 헤더(주문일자 + '주문상세 >')는 카드 밖이라 호출부가 그린다. 여기는 카드 본체만 맡는다.
//
// 액션 버튼은 화면마다 다르다(B-21은 교환·반품·배송상태 확인, B-28은 배송상태 확인만). 기본값은
// B-21 구성이고, B-28처럼 다른 조합이 필요하면 `actions`로 갈아 끼운다.
//
// 액션 버튼은 전부 '준비 중' 토스트다.
//   - 교환·반품 : MVP 미구현(`BR-B21-01-09`)
//   - 배송상태 확인 : B-22가 `Full` 범위(constants/screens.ts)
// 시안에 있는 버튼이라 노출은 하고 동작만 막는다(의사결정 기록 2026-08-28).
//
// ⚠️ 명세는 상태별로 버튼이 갈린다고 적고 있다(결제대기=주문취소 / 배송중·배송완료=배송상태 확인 /
//    배송완료=구매확정·교환·반품 / 배송준비중·구매확정=버튼 없음, `BR-07`). 시안에는 '교환·반품·
//    배송상태 확인' 한 벌만 그려져 있고 구매확정 버튼이 없다. 디자인이 의도적으로 추가한 구성이라
//    들어서(2026-09-04) **시안 그대로** 두었다. 상태별 분기는 규격 확정 후.

/** 시안: 높이 36 · radius 8 · 테두리 1 · label-13. */
export const OUTLINE_ACTION_CLASS =
  'border-border-quarternary rounded-8 text-label-13 text-content-tertiary flex h-9 w-full items-center justify-center border px-3 py-2';

/** 교환·반품이 나눠 쓰는 회색 바 안의 반쪽. */
const SPLIT_ACTION_CLASS =
  'text-label-13 text-content-secondary flex h-4.5 w-40 items-center justify-center gap-1';

function OrderItemRow({ item }: { item: OrderItem }) {
  return (
    <div className="flex w-full items-center gap-3">
      {/* 시안은 60×60 상품 사진이다. 이미지가 없거나 앱이 그릴 수 없는 외부 주소면 자리만 회색으로
          둔다. 백엔드 이미지는 외부 절대 URL이라 거르지 않으면 화면이 통째로 죽는다(`lib/imageSource`). */}
      {!isRenderableImageSrc(item.imageUrl) ? (
        <div aria-hidden className="bg-surface-tertiary rounded-8 size-15 shrink-0" />
      ) : (
        <Image
          alt=""
          className="rounded-8 size-15 shrink-0 object-cover"
          height={60}
          src={item.imageUrl}
          width={60}
        />
      )}

      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-caption-12 text-content-tertiary">{item.name}</p>
        <div className="text-caption-10 text-content-quarternary flex items-center gap-1">
          {item.option !== undefined && <span>{item.option}</span>}
          <span>{item.quantity}</span>
        </div>
        {/* 금액은 옵션 줄 아래에 붙는다(시안 gap-2). */}
        <p className="text-label-12 text-content-primary">{item.price.toLocaleString('ko-KR')}원</p>
      </div>
    </div>
  );
}

interface OrderCardProps {
  order: OrderSummary;
  /** 카드 하단 액션 영역. 넘기지 않으면 B-21 구성(교환·반품 + 배송상태 확인)을 그린다. */
  actions?: ReactNode;
  /** 셀러명 뒤 세로 구분 표시. B-21 시안에만 있다. */
  showSellerDivider?: boolean;
}

export function OrderCard({ order, actions, showSellerDivider = true }: OrderCardProps) {
  return (
    <article className="border-divider-default rounded-12 flex w-full flex-col gap-2 border px-3 pt-1 pb-3">
      <div className="border-divider-default flex w-full items-center gap-2 border-b py-2">
        <h3 className="text-label-16 text-content-primary">{order.sellerName}</h3>
        {/* 시안의 세로 실선(Vector 1, 0.8×8.8). B-21 카드에만 있고 B-28에는 없다. */}
        {showSellerDivider && (
          <span aria-hidden className="bg-border-quarternary h-2 w-px shrink-0" />
        )}
      </div>

      <div className="flex w-full flex-col gap-3">
        <div className="flex w-full flex-col gap-1.5 py-1">
          {/* 화면이 모르는 상태면 줄을 비운다(`OrderSummary.status` 주석). */}
          {order.status !== undefined && (
            <p className="text-label-13 text-content-secondary w-full">
              {getOrderStatusMeta(order.status).label}
            </p>
          )}
          {order.items.map((item) => (
            <OrderItemRow item={item} key={item.id} />
          ))}
        </div>

        <div className="flex w-full flex-col gap-2">
          {actions ?? (
            <>
              {/* 교환·반품은 한 줄을 반씩 나눠 쓴다. 가운데 구분선은 왼쪽 칸의 오른쪽 테두리다. */}
              <div className="bg-surface-button-quarternary-hover rounded-8 flex w-full items-center justify-between px-1 py-2">
                <ComingSoonButton
                  className={`${SPLIT_ACTION_CLASS} border-border-quarternary border-r`}
                >
                  교환
                </ComingSoonButton>
                <ComingSoonButton className={SPLIT_ACTION_CLASS}>반품</ComingSoonButton>
              </div>

              <ComingSoonButton className={OUTLINE_ACTION_CLASS}>배송상태 확인</ComingSoonButton>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
