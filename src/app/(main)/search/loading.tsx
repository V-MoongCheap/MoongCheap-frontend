import { AppBar } from '@/components/layout/AppBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { SEARCH_TITLE } from '@/constants/searchMessages';

// B-05 검색 입력으로 이동하는 동안의 로딩 화면(TC-B06-01-10, #167). 검색 결과(B-06)의 검색바를
// 눌러 돌아올 때 쓰인다.
//
// 이 라우트는 `searchParams`를 기다리는 동적 페이지라, 로딩 화면이 없으면 서버 응답이 올 때까지
// 결과 화면이 아무 반응 없이 멈춰 있다. 로딩 화면은 미리 받아 두므로(prefetch) 이동하는 즉시 뜬다.
//
// 앱바는 실제 화면과 같은 것을 그리고, 입력창 자리만 비운다(높이 40, B-05 입력창과 같은 알약).
// 장바구니 버튼은 준비 중 기능이라 로딩 화면에는 넣지 않는다.
//
// 하위 경로(`search/results`)는 자기 `loading.tsx`가 있어 그쪽 로딩 화면을 쓴다.
export default function SearchLoading() {
  return (
    <main className="flex w-full flex-1 flex-col">
      <AppBar backHref="/" title={SEARCH_TITLE} />
      <div className="flex w-full items-center px-4 py-3">
        <Skeleton className="rounded-round h-10 w-full" />
      </div>
    </main>
  );
}
