import { Skeleton } from '@/components/ui/Skeleton';

// B-06 검색 결과 목록 자리표시자. 검색 응답을 기다리는 동안 빈 화면으로 멈춘 것처럼 보이지 않게
// 결과 카드(`SearchResultCard`) 모양을 그대로 흉내 낸다(TC-B06-01-10, #167).
//
// 두 곳이 쓴다.
//   검색 결과 첫 조회 중(`SearchResultsView`)
//   검색 결과로 이동하는 중의 라우트 로딩 화면(`app/(main)/search/results/loading.tsx`)
//
// 카드 크기는 결과 카드와 같다. 사진 영역 184(h-46), 아래 정보 영역은 배지 · 상품명 · 규격 세 줄.
// 393 화면에 세 장이면 첫 화면이 채워진다.

const SKELETON_CARD_COUNT = 3;

export function SearchResultsSkeleton() {
  return (
    <div aria-busy className="flex w-full flex-col gap-5 p-4">
      {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
        <div
          key={index}
          className="border-border-button-quarternary rounded-12 flex w-full flex-col overflow-hidden border"
        >
          <Skeleton className="h-46 w-full rounded-none" />
          <div className="border-border-subtle flex w-full flex-col gap-1 border-t px-3 py-2">
            <Skeleton className="rounded-4 h-4.5 w-16" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
