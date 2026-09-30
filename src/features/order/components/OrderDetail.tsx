import { ComingSoonButton } from '@/components/ui/ComingSoonButton';
import type { OrderDetail as OrderDetailData } from '@/types/order';

import { OUTLINE_ACTION_CLASS, OrderCard } from './OrderCard';

// B-28 주문상세. 시안 `453:25878`.
//
// 상품 카드는 B-21과 같은 부품이다(OrderCard). 액션만 '배송상태 확인' 하나로 갈아 끼운다.
//
// ⚠️ 시안과 기능명세가 어긋난다. 시안대로 그리고 동작만 막았다.
//    - 하단 '이 주문내역 삭제하기'는 명세 `FN-B28-01`에 없는 기능이다
//    - 명세의 액션은 '배송현황' / '수령 확인'(상태별 조건부)인데 시안엔 '배송상태 확인' 하나다
//    - 명세의 상품 카드는 배송 유형·배송비·공구 정보를 더 요구하는데 시안에 자리가 없다

/** 시안: 제목 아래 구분선. 배송정보·결제내역이 같은 모양을 쓴다. */
const SECTION_TITLE_CLASS =
  'text-section-title-16 text-content-primary border-divider-default w-full border-b pb-2';

/**
 * 배송지를 입력하기 전 주문의 배송정보 자리 안내. 문구는 QA 요청(#220) 그대로다.
 *
 * 명세(BR-B15-01-15)는 여기에 배송지 입력 진입점을 두라고 하지만 배송지 입력 화면(B-15)이 연기 상태라
 * 안내 한 줄만 둔다. 화면이 생기면 이 자리에 진입 버튼을 붙인다.
 */
const SHIPPING_ADDRESS_PENDING = '배송지 입력 전이에요';

/** 금액 표기. 시안은 `35,100원`처럼 세 자리마다 끊는다. */
function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}

/** 배송지를 입력한 주문인지. 주소가 없거나 공백뿐이면 입력 전이다. */
function hasShippingAddress(order: OrderDetailData): boolean {
  return (order.shipping.address ?? '').trim() !== '';
}

interface OrderDetailProps {
  order: OrderDetailData;
}

export function OrderDetail({ order }: OrderDetailProps) {
  return (
    <div className="flex w-full flex-col gap-8 py-4">
      <section className="flex w-full flex-col gap-2.5">
        <div className="flex w-full items-center gap-3 px-4">
          {/* 시안은 결제일(`26.08.26 결제`)이다. 응답에 결제일이 없으면(결제대기 주문은 결제일 자체가
              없다) 목록(B-21) 그룹 헤더처럼 주문일자만 쓴다. 결제하지 않은 날짜에 '결제'를 붙이지 않는다. */}
          <h2 className="text-section-title-16 text-content-primary shrink-0">
            {order.paidAt === undefined ? order.orderedAt : `${order.paidAt} 결제`}
          </h2>
          {/* 백엔드 주문번호는 `ORD_` + UUID(40자)라 시안 값(14자리)보다 훨씬 길다. 넘치지 않게 끊어 감싼다. */}
          <p className="text-caption-10 text-content-quarternary min-w-0 break-all">
            주문번호 {order.orderNumber}
          </p>
        </div>

        <div className="w-full px-4">
          <OrderCard
            actions={
              <ComingSoonButton className={OUTLINE_ACTION_CLASS}>배송상태 확인</ComingSoonButton>
            }
            order={order}
            showSellerDivider={false}
          />
        </div>
      </section>

      <section className="flex w-full flex-col gap-4 px-4">
        <h2 className={SECTION_TITLE_CLASS}>배송정보</h2>
        {/* 배송지 유무는 주소로만 판단한다. 배송지 입력 전 주문도 전화번호는 서버 마스킹이 '****'를
            만들어 보내서, 전화번호로는 입력 여부를 알 수 없다(#220). */}
        {hasShippingAddress(order) ? (
          <dl className="text-body-14 flex w-full flex-col gap-3">
            {[
              { label: '이름', value: order.shipping.recipient },
              { label: '전화번호', value: order.shipping.phoneMasked },
              { label: '주소', value: order.shipping.address },
            ].map(({ label, value }) => (
              <div className="flex w-full items-center" key={label}>
                <dt className="text-content-tertiary w-19 shrink-0">{label}</dt>
                <dd className="text-content-primary min-w-0 flex-1">{value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-body-14 text-content-tertiary">{SHIPPING_ADDRESS_PENDING}</p>
        )}
      </section>

      <section className="flex w-full flex-col gap-4 px-4">
        <h2 className={SECTION_TITLE_CLASS}>결제내역</h2>

        <div className="flex w-full flex-col gap-4">
          <dl className="text-label-14 text-content-primary flex w-full flex-col gap-2">
            {order.payment.lines.map((line) => (
              <div className="flex w-full items-center justify-between" key={line.label}>
                <dt>{line.label}</dt>
                {/* 시안의 배송비만 `3000원`으로 자리수 구분이 빠져 있다. 같은 목록 안에서 표기가
                    갈리는 건 시안 실수로 보고 전 항목을 같은 규칙으로 끊는다. */}
                <dd>{formatWon(line.amount)}</dd>
              </div>
            ))}
          </dl>

          <div className="flex w-full flex-col items-end">
            <div className="flex w-full items-center justify-between">
              <p className="text-label-14 text-content-primary">총 결제금액</p>
              <p className="text-title-18 text-content-brand">{formatWon(order.payment.total)}</p>
            </div>
            {order.payment.method !== undefined && (
              <p className="text-caption-12 text-content-tertiary w-full text-right">
                {order.payment.method}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 명세에 없는 기능이라 노출만 하고 동작은 막는다(2026-08-28 미구현 진입점 규칙). */}
      <div className="w-full px-4">
        <ComingSoonButton className="border-border-button-quarternary bg-surface-button-quarternary-default text-content-primary text-button-15 rounded-8 flex h-12 w-full items-center justify-center border px-3">
          이 주문내역 삭제하기
        </ComingSoonButton>
      </div>
    </div>
  );
}
