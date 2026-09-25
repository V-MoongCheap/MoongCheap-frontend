import { Skeleton } from '@/components/ui/Skeleton';

// B-14 결제수단 목록 첫 조회 자리표시자.
//
// ⚠️ 로딩 화면은 시안이 없다(FN-B14-01 디자인 확인사항 1번). 새 화면을 그리지 않고 실제 카드와
//    같은 뼈대(썸네일 + 두 줄)만 회색 블록으로 세운다. 문구는 넣지 않는다(`AddressListSkeleton`과
//    같은 방침). 명세는 300ms 넘게 걸릴 때만 보이라고 하지만, B-30과 같이 바로 보인다.

/** 자리표시 카드 수. 배열 인덱스를 key로 쓰지 않으려고 이름을 붙여 둔다. */
const PLACEHOLDER_KEYS = ['first', 'second'] as const;

export function PaymentMethodListSkeleton() {
  return (
    <div aria-busy className="flex w-full flex-col gap-3" role="status">
      <span className="sr-only">결제수단 목록을 불러오는 중</span>

      {PLACEHOLDER_KEYS.map((key) => (
        // 여백·모서리는 PaymentMethodCard와 같은 값을 쓴다.
        <div
          className="bg-surface-secondary rounded-12 flex w-full items-center gap-3 px-4 py-3.5"
          key={key}
        >
          <Skeleton className="bg-surface-tertiary h-[38px] w-[30px] shrink-0 rounded-[4px]" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            {/* 카드사명 · 마스킹 번호 */}
            <Skeleton className="bg-surface-tertiary h-[22px] w-28" />
            <Skeleton className="bg-surface-tertiary h-5 w-40" />
          </div>
        </div>
      ))}
    </div>
  );
}
