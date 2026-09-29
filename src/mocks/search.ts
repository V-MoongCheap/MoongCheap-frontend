import type { ProductSearchResult } from '@/types/search';

/**
 * B-06 상품 도감 검색 결과 목 데이터. 시안 `1153:72821`의 카드 5장을 그대로 옮겼다.
 *
 * 검색 자체는 실제 API(`GET /api/products-search/search`)를 쓴다. 이 목은 **호출이 실패했을 때의
 * 대체물**이다(미로그인 · `NEXT_PUBLIC_API_BASE_URL` 미배선 · OpenSearch 색인 비어 있음).
 * `lib/productApi` + `ProductDetailView`가 쓰는 것과 같은 방식이다.
 *
 * 목이 실데이터보다 필드가 많다. 검색 응답에는 수요 관련 값(마감 D-day · 모집중/마감임박 ·
 * 퀵 참여 건수 · 참여 인원)이 없어서다([[types/search]]). 그래서 실제 검색이 성공하면 카드는
 * 시안의 '수요 없음' 모양으로 그려지고, 목으로 떨어졌을 때만 시안의 두 모양이 다 보인다.
 *
 * ⚠️ 이미지가 3장뿐이다. #60·#73에서 `public/images/catalog-search/`에 반입된 것이
 *    골드(2-1) · 뷰티(2-2) · 코어맥스(2-3)뿐이라 시안의 다이어트 · 당케어 카드는 이미지 영역이
 *    빈 채로(흰 바탕만) 그려진다. 에셋 추가 반입 대상.
 */
const MOCK_RESULTS: readonly ProductSearchResult[] = [
  {
    id: 'catalog-search-1',
    name: '[종근당건강] 락토핏 생유산균 뷰티',
    spec: '프로바이오틱스/저분자콜라겐펩타이드GT 60포 120g',
    thumbnailUrl: '/images/catalog-search/2-2.webp',
    dday: 1,
    demandStatus: 'closing',
    quickDealCount: 3,
    participantCount: 900,
  },
  {
    id: 'catalog-search-2',
    name: '[종근당건강] 락토핏 생유산균 코어맥스',
    spec: '프로바이오틱스/아연 60포 120g',
    thumbnailUrl: '/images/catalog-search/2-3.webp',
    dday: 4,
    demandStatus: 'gathering',
    quickDealCount: 3,
    participantCount: 800,
  },
  {
    id: 'catalog-search-3',
    name: '[종근당건강] 락토핏 생유산균 골드',
    spec: '프로바이오틱스 80포 160g',
    thumbnailUrl: '/images/catalog-search/2-1.webp',
  },
  {
    id: 'catalog-search-4',
    name: '[종근당] 락토핏 다이어트',
    spec: '덴마크 유산균이야기',
  },
  {
    id: 'catalog-search-5',
    name: '[종근당] 락토핏 당케어',
    spec: '덴마크 유산균이야기',
  },
];

/**
 * 검색 결과 목 카드 한 장. 목 카드를 눌러 들어온 상품 상세(`mocks/product.ts`)가 같은 상품을 그릴 때
 * 쓴다(#225).
 */
export function findMockSearchResult(id: string): ProductSearchResult | undefined {
  return MOCK_RESULTS.find((product) => product.id === id);
}

/**
 * 검색 결과 목. 연동 실패 시에만 쓰인다.
 *
 * 검색어로 거른다. 검색어와 무관하게 늘 같은 5장을 돌려주면 `안녕하세요`로 검색해도 락토핏이
 * 나와, 조회가 실패했다는 사실이 화면에서 드러나지 않는다. 이름·규격에 검색어가 들어간 것만
 * 남기면 실제 검색과 비슷하게 보이고, 없는 검색어에서는 빈 상태 화면도 확인할 수 있다.
 *
 * 서버 검색은 OpenSearch 형태소 분석을 쓰므로 이 단순 부분일치와 결과가 다를 수 있다. 목의
 * 목적은 화면 검수라 여기까지만 맞춘다.
 */
export async function mockSearchProducts(query: string): Promise<readonly ProductSearchResult[]> {
  const needle = query.trim().toLowerCase();
  if (needle === '') {
    return [];
  }
  return MOCK_RESULTS.filter(
    (product) =>
      product.name.toLowerCase().includes(needle) ||
      (product.spec?.toLowerCase().includes(needle) ?? false),
  );
}
