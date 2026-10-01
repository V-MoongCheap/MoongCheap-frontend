import { LIST_PAGE_SIZE } from '@/constants/businessRules';

import { apiFetch } from './api';

/**
 * 상품 도감 검색(도메인 A) 백엔드 호출.
 *
 * 백엔드 소스 `ProductSearchController`·`ProductSearchResponse`(V-MoongCheap/MoongCheap-backend@develop)로
 * 규격을 확인해 작성했다. 검색은 OpenSearch 색인을 조회한다.
 *
 * ⚠️ `/api/products-search/search`는 `permitAll` 목록에 없다(색인용 `/internal/**`만 열려 있다).
 * 즉 **세션(SID)이 필요**하므로 `apiFetch`의 `credentials:'include'`가 동작하는 **client에서**
 * 불러야 한다(서버 컴포넌트에서 부르면 쿠키가 없어 401). `lib/productApi`와 같은 제약이다.
 *
 * ⚠️ 로컬에서 실제로 결과가 나오려면 OpenSearch 컨테이너가 떠 있고
 * (`docker/docker-compose.local.yml`의 `opensearch`) 상품이 색인돼 있어야 한다
 * (`POST /api/products-search/internal/bulk`). 색인이 비어 있으면 정상 200에 빈 배열이 온다.
 */

/** `GET /api/products-search/search` 응답 항목. 백엔드 `ProductSearchItemDto`와 필드가 일치한다. */
export interface ProductSearchItemDto {
  id: number;
  name: string;
  /** 규격 요약. nullable. */
  specSummary: string | null;
  /** 정가. nullable. */
  listPrice: number | null;
  /** nullable. */
  thumbnailUrl: string | null;
  /**
   * 상품 도감 노출 상태(`ACTIVE` | `INACTIVE`). nullable.
   *
   * ⚠️ 시안 카드의 `모집중`·`마감임박` 배지와는 **다른 축**이다. 이 값은 도감에 상품을 노출할지
   * 여부일 뿐이고 수요·공구 진행 상태가 아니다. 배지에 그대로 쓰면 안 된다.
   */
  status: string | null;
}

/** `GET /api/products-search/search` 응답. 백엔드 `ProductSearchResponse`와 필드가 일치한다. */
export interface ProductSearchResponseDto {
  products: ProductSearchItemDto[];
  /** 이번 페이지에 담긴 개수. 전체 건수가 아니다. */
  size: number;
  hasNext: boolean;
  page: number;
}

/** 상품 검색 경로. 조회와 HTML preload(`lib/apiPreload`)가 같은 주소를 쓰도록 한 곳에서 만든다. */
export function productSearchPath(query: string, page = 0, size: number = LIST_PAGE_SIZE): string {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    size: String(size),
  });
  return `/api/products-search/search?${params.toString()}`;
}

/**
 * 상품 검색. `GET /api/products-search/search?q=&page=&size=`.
 *
 * `page`는 0부터다. `size`는 백엔드가 1~100으로 제한하며 기본값이 20이라 목록 공통
 * `LIST_PAGE_SIZE`(BR-B17-01-11 · BR-B21-01-11)와 값이 같다.
 */
export async function searchProducts(
  query: string,
  page = 0,
  size: number = LIST_PAGE_SIZE,
): Promise<ProductSearchResponseDto> {
  const response = await apiFetch(productSearchPath(query, page, size));
  return (await response.json()) as ProductSearchResponseDto;
}
