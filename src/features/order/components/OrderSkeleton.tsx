import { Skeleton } from '@/components/ui/Skeleton';

// B-21 주문 내역 · B-28 주문상세 조회 중 자리표시자.
//
// ⚠️ 로딩 화면은 시안이 없다(명세가 `🖌️ 디자인 필요`로 남겨 뒀다). 배송지 목록(`AddressListSkeleton`)과
//    같은 방침으로 새 화면을 그리지 않고, 실제 화면과 같은 뼈대만 회색 블록으로 세운다. 문구는 넣지
//    않는다. 시안이 나오면 교체한다.

/** 배열 인덱스를 key로 쓰지 않으려고 이름을 붙여 둔다. */
const LIST_PLACEHOLDER_KEYS = ['first', 'second'] as const;
const SHIPPING_ROW_KEYS = ['recipient', 'phone', 'address'] as const;
const PAYMENT_ROW_KEYS = ['product', 'shipping', 'total'] as const;

/** 카드 본체. 테두리 · 여백은 `OrderCard`와 같은 값이고 글자 자리만 블록으로 바꾼다. */
function OrderCardBodySkeleton() {
  return (
    <div className="border-divider-default rounded-12 flex w-full flex-col gap-2 border px-3 pt-1 pb-3">
      {/* 셀러명 */}
      <div className="border-divider-default w-full border-b py-2">
        <Skeleton className="h-6 w-24" />
      </div>

      <div className="flex w-full flex-col gap-1.5 py-1">
        {/* 주문 상태 */}
        <Skeleton className="h-5 w-16" />
        <div className="flex w-full items-center gap-3">
          {/* 상품 사진 60×60 */}
          <Skeleton className="rounded-8 size-15 shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Skeleton className="h-4.5 w-full" />
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-4.5 w-16" />
          </div>
        </div>
      </div>

      {/* 액션 줄. 목록 카드는 두 줄(교환·반품 34 + 배송상태 확인 36)이라 긴 쪽에 맞춘다. */}
      <Skeleton className="rounded-8 h-[34px] w-full" />
      <Skeleton className="rounded-8 h-9 w-full" />
    </div>
  );
}

/** 목록 한 칸(주문일자 헤더 + 카드). 다음 페이지를 이어 받는 동안 목록 끝에 하나 붙인다. */
export function OrderCardSkeleton() {
  return (
    <div aria-hidden className="flex w-full flex-col gap-1">
      <div className="flex w-full items-center justify-between px-4 py-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-4.5 w-14" />
      </div>
      <div className="w-full px-4">
        <OrderCardBodySkeleton />
      </div>
    </div>
  );
}

interface OrderListSkeletonProps {
  /**
   * 탭 · 검색창 자리까지 그릴지. '전체' 탭 첫 조회에서만 켠다.
   *
   * 주문이 0건이면 탭이 통째로 사라진다(빈 상태 시안 `453:26371`). 결과를 모르는 채로 진짜 탭을
   * 그리면 응답 뒤에 사라지며 깜빡인다.
   */
  withHeader?: boolean;
}

/** 목록 첫 조회. */
export function OrderListSkeleton({ withHeader = false }: OrderListSkeletonProps) {
  return (
    <div aria-busy className="flex w-full flex-1 flex-col" role="status">
      <span className="sr-only">주문 내역을 불러오는 중</span>

      {withHeader && (
        <div className="flex w-full flex-col gap-2 px-4 pt-3.25">
          {/* 탭(36 + 위아래 여백 4) · 검색창(34) 자리 */}
          <Skeleton className="rounded-12 h-11 w-full" />
          <Skeleton className="rounded-24 h-8.5 w-full" />
        </div>
      )}

      <div className="flex w-full flex-col gap-2 pt-2">
        {LIST_PLACEHOLDER_KEYS.map((key) => (
          <OrderCardSkeleton key={key} />
        ))}
      </div>
    </div>
  );
}

/** 상세 첫 조회. 구획은 `OrderDetail`과 같다(결제 헤더 + 카드 · 배송정보 · 결제내역). */
export function OrderDetailSkeleton() {
  return (
    <div aria-busy className="flex w-full flex-col gap-8 py-4" role="status">
      <span className="sr-only">주문상세를 불러오는 중</span>

      <div aria-hidden className="flex w-full flex-col gap-2.5">
        <div className="flex w-full items-center gap-3 px-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-3.5 w-32" />
        </div>
        <div className="w-full px-4">
          <OrderCardBodySkeleton />
        </div>
      </div>

      {[SHIPPING_ROW_KEYS, PAYMENT_ROW_KEYS].map((rows) => (
        <div aria-hidden className="flex w-full flex-col gap-4 px-4" key={rows[0]}>
          {/* 구획 제목 */}
          <Skeleton className="h-6 w-20" />
          <div className="flex w-full flex-col gap-3">
            {rows.map((row) => (
              <Skeleton className="h-5 w-full" key={row} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
