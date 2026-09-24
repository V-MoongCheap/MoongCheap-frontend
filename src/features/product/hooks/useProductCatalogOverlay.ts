'use client';

import { useEffect, useState } from 'react';

import { ApiError } from '@/lib/api';
import { PRODUCT_ERROR_CODE, fetchProductCatalogDetail, toCatalogId } from '@/lib/productApi';
import type { ProductDetail } from '@/types/product';

/**
 * 도감 조회 진행 상태.
 *
 * - `loading`   조회 중. 아직 mock을 그리면 안 된다(없는 상품이면 다른 상품이 잠깐 보인다).
 * - `ready`     실데이터를 덮었다.
 * - `fallback`  조회를 안 했거나(숫자 아닌 홈 목 id) 404가 아닌 이유로 실패했다. mock을 그린다.
 * - `notFound`  백엔드가 404(`PRODUCT_001`)를 줬다. 없는 상품이라 화면 대신 404를 그린다.
 */
export type ProductCatalogStatus = 'loading' | 'ready' | 'fallback' | 'notFound';

/**
 * 서버에서 그린 mock 상품 위에 상품 도감 실데이터(`GET /api/product-catalog/{id}`)를 덮는다.
 *
 * 상품 상세(B-08 `ProductDetailView`)와 수요 등록(B-09 `DemandFormView`)이 같은 상품을 같은
 * 방식으로 보여 줘야 해서 한 곳에 둔다. 세션(SID httpOnly 쿠키)이 필요해 서버 컴포넌트에서는
 * 부를 수 없다(`lib/productApi.ts` 주석).
 *
 * 덮는 값은 도감 응답에 있는 것뿐이다(이름·규격·썸네일·정가·상품설명). 브랜드·퀵 참여 딜 등
 * 응답에 없는 값은 mock이 그대로 남는다. 조회가 실패하면(미로그인·미배선·네트워크) mock을 유지한다.
 *
 * ⚠️ 404만은 mock으로 덮지 않는다(#151). mock은 모르는 id에도 상품을 돌려주므로, 없는 상품
 *    주소로 들어오면 다른 상품 화면이 그대로 떠 버린다. 호출부가 `notFound`를 보고 404를 그린다.
 *
 * 초기 상품을 state로 복사하므로, 호출부 페이지는 상품이 바뀔 때 리마운트되도록 `key`를 준다.
 */
export function useProductCatalogOverlay(initialProduct: ProductDetail): {
  product: ProductDetail;
  status: ProductCatalogStatus;
} {
  const [product, setProduct] = useState(initialProduct);
  // 백엔드 id는 숫자 Long이다. 홈 목의 문자열 id(demand-1 등)는 확정 실패라 조회하지 않는다.
  const [status, setStatus] = useState<ProductCatalogStatus>(() =>
    toCatalogId(initialProduct.id) === null ? 'fallback' : 'loading',
  );

  useEffect(() => {
    if (toCatalogId(initialProduct.id) === null) {
      return;
    }
    let active = true;
    fetchProductCatalogDetail(initialProduct.id)
      .then((dto) => {
        if (!active) return;
        setProduct((prev) => ({
          ...prev,
          name: dto.name,
          spec: dto.specSummary ?? prev.spec,
          thumbnailUrl: dto.thumbnailUrl,
          listPrice: dto.listPrice ?? prev.listPrice,
          // 조회 성공 시 description은 서버 값을 그대로 반영한다. null이면 undefined로 두어
          // 상품설명 섹션을 숨긴다(mock 설명으로 대체하지 않는다. 다른 상품 문구 노출 방지).
          description: dto.description ?? undefined,
        }));
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (!active) return;
        // 상태 코드만 보지 않고 코드까지 맞춘다. 게이트웨이·경로 설정 오류로 나는 404까지 없는
        // 상품으로 읽으면 모든 상품이 404가 된다. 그 밖의 실패는 정상 경로(로그인 전·백엔드
        // 미기동)라 mock 그대로 보여준다.
        const isNotFound =
          error instanceof ApiError &&
          error.status === 404 &&
          error.code === PRODUCT_ERROR_CODE.NOT_FOUND;
        setStatus(isNotFound ? 'notFound' : 'fallback');
      });
    return () => {
      active = false;
    };
  }, [initialProduct.id]);

  return { product, status };
}
