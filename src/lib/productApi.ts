import { apiFetch } from './api';

/**
 * 상품 도감(도메인 A) 백엔드 호출.
 *
 * 백엔드 소스(jnj3j3/MoongCheap_backend@develop) `ProductCatalogController`·`ProductCatalogDto`로
 * 규격을 확인해 작성했다. 다른 도메인까지 일반화한 api-client는 규격 합의 전이라 만들지 않는다(CLAUDE.md).
 *
 * ⚠️ 상세 조회는 `anyRequest().authenticated()` 대상이라 **세션(SID)이 필요**하다. `apiFetch`의
 * `credentials:'include'`는 브라우저 호출에서만 쿠키를 싣기 때문에, 이 함수는 **client에서** 부른다
 * (서버 컴포넌트에서 부르면 쿠키가 없어 401). 미로그인/미배선/네트워크 오류는 ApiError로 올라온다.
 */

/** `GET /api/product-catalog/{id}` 응답. 백엔드 `ProductCatalogDto`와 필드가 일치한다. */
export interface ProductCatalogDetailDto {
  id: number;
  name: string;
  thumbnailUrl: string;
  /** 정가. nullable. */
  listPrice: number | null;
  /** 규격 요약(≤500). nullable. */
  specSummary: string | null;
  /** 상품설명 본문(TEXT). nullable. */
  description: string | null;
}

/** 도감 조회 실패 중 화면이 따로 반응하는 비즈니스 코드. */
export const PRODUCT_ERROR_CODE = {
  /** 404. 없는 도감 id(#151). */
  NOT_FOUND: 'PRODUCT_001',
} as const;

/**
 * 화면 상품 id(라우트 `productId`)를 백엔드 도감 id(Long)로 바꾼다. 바꿀 수 없으면 null.
 *
 * 홈 목 카드의 id는 `demand-1` 같은 문자열이라 백엔드로 보내면 도감 조회는 404, 수요 등록은
 * `catalogId`가 NaN → JSON에서 null이 되어 400이 난다. 부르기 전에 여기서 걸러낸다.
 * 2^53을 넘는 숫자는 `Number`가 반올림해 다른 id가 되므로 함께 막는다(`parseCreatedId`와 같은 이유).
 */
export function toCatalogId(id: string): number | null {
  if (!/^\d+$/.test(id)) {
    return null;
  }
  const catalogId = Number(id);
  return Number.isSafeInteger(catalogId) ? catalogId : null;
}

/**
 * 상품 도감 상세 조회(FN-B08-01). `GET /api/product-catalog/{id}`.
 * id는 백엔드에서 Long이라 숫자 문자열이어야 한다(홈 목의 문자열 id로는 404가 난다).
 */
export async function fetchProductCatalogDetail(id: string): Promise<ProductCatalogDetailDto> {
  const response = await apiFetch(`/api/product-catalog/${encodeURIComponent(id)}`);
  return (await response.json()) as ProductCatalogDetailDto;
}
