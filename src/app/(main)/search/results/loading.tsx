import { Skeleton } from '@/components/ui/Skeleton';
import { SearchResultsSkeleton } from '@/features/search/components/SearchResultsSkeleton';

// B-06 검색 결과로 이동하는 동안의 로딩 화면(TC-B06-01-10, #167).
//
// 이 라우트는 `searchParams`를 기다리는 동적 페이지라, 로딩 화면이 없으면 서버 응답이 올 때까지
// 이전 화면이 아무 반응 없이 멈춰 있다. 로딩 화면은 미리 받아 두므로(prefetch) 이동하는 즉시 뜬다.
//
// 로딩 화면은 검색어를 모른다(`loading.tsx`는 params를 받지 않는다). 그래서 상단 바는 모양만
// 그린다. 크기는 `SearchQueryBar`와 같다(뒤로가기 34 · 검색어 칸 높이 40 · 장바구니 40).
export default function SearchResultsLoading() {
  return (
    <main className="flex w-full flex-1 flex-col">
      <div className="flex w-full items-center gap-1 px-2 py-3">
        <span className="size-[34px] shrink-0" />
        <Skeleton className="rounded-20 h-10 min-w-0 flex-1" />
        <span className="size-10 shrink-0" />
      </div>
      <SearchResultsSkeleton />
    </main>
  );
}
