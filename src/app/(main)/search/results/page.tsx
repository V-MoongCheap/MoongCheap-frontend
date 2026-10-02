import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { SEARCH_QUERY_MIN_LENGTH } from '@/constants/businessRules';
import { SearchQueryBar } from '@/features/search/components/SearchQueryBar';
import { SearchResultsView } from '@/features/search/components/SearchResultsView';
import { preloadApiGet } from '@/lib/apiPreload';
import { productSearchPath } from '@/lib/productSearchApi';

export const metadata: Metadata = {
  title: '검색 결과',
};

// B-06 상품 도감 검색 결과. B-05 검색 입력에서 진입한다. 시안 `1153:72821` · `1153:72803` ·
// `1153:72812`(필터 3종).
//
// B-05와 라우트를 나눈 이유: 상단 구조가 다르다. B-05는 앱바(`검색하기` + 장바구니) 아래에 입력창이
// 따로 있고, B-06은 앱바 없이 한 줄이 뒤로가기 · 검색어 · 지우기 · 장바구니를 다 갖는다.
// 뒤로가기 동선도 결과 → 검색 입력 → 홈으로 자연스럽게 이어진다.
//
// (main) 라우트 그룹에 둔다 - 하단 GNB는 이 그룹의 공용 레이아웃이 그린다. 시안에도 하단바가 있다.
//
// 검색어가 없거나 최소 길이(BR-B05-01-01) 미만이면 그릴 것이 없으므로 검색 입력으로 되돌린다.
// 주소창을 직접 편집하거나 오래된 링크로 들어온 경우다.
//
// 생성 타입(PageProps)은 `next build` 전에 존재하지 않아 typecheck에서 깨지므로 searchParams를
// 직접 타이핑한다(app/layout.tsx와 같은 이유).
export default async function SearchResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? '';

  if (query.length < SEARCH_QUERY_MIN_LENGTH) {
    redirect('/search');
  }
  // 첫 페이지 검색을 HTML 단계로 앞당긴다. LCP인 첫 카드 사진이 이 응답 뒤에야 그려진다(`lib/apiPreload`).
  preloadApiGet(productSearchPath(query));

  return (
    // 배경은 셸((main) 레이아웃)의 `background/default`를 그대로 쓴다.
    //
    // 시안의 결과 프레임은 `background/subtle`이라 한 번 그렇게 넣었다가 되돌렸다. 두 토큰의
    // 간격이 테마마다 달라서다. 라이트는 #ffffff 대 #fafafa로 거의 같은 색인데, 다크는
    // #1a1a1a 대 #303030이라 이 화면만 통째로 떠 보인다. 시안이 라이트 기준이라 '살짝 다른 톤'을
    // 의도한 것인데, 그 의도가 다크에서는 재현되지 않는다.
    <main className="flex w-full flex-1 flex-col">
      <SearchQueryBar query={query} searchHref="/search" />
      {/* key로 검색어가 바뀔 때 뷰를 리마운트한다. 필터 선택이 이전 검색어의 것으로 남지 않게 한다. */}
      <SearchResultsView key={query} productHrefBase="/products" query={query} />
    </main>
  );
}
