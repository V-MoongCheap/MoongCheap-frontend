import type { Metadata } from 'next';

import { ProductDetailView } from '@/features/product/components/ProductDetailView';
import { mockGetProductDetail } from '@/mocks/product';

export const metadata: Metadata = {
  title: '상품 상세',
};

// B-08 상품 상세. 홈 상품 카드(ProductCard·ProductRow)·도감 검색(B-06)에서 진입한다.
//
// 상품 조회만 서버에서 하고(mock), 상품설명 펼침·아코디언 등 상호작용은 ProductDetailView(client)가
// 맡는다. 뒤로가기는 진입 경로가 다양해(홈/검색) history 기반이다.
//
// 생성 타입(PageProps)은 `next build` 전에 존재하지 않아 typecheck에서 깨지므로 params를 직접
// 타이핑한다(app/layout.tsx와 같은 이유).
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = await mockGetProductDetail(productId);

  // key로 상품이 바뀔 때 뷰를 리마운트한다. ProductDetailView가 초기 prop을 state로 복사하고
  // 실데이터를 그 위에 덮는 구조라, 리마운트 없이 상세→상세로 이동하면 이전 상품 state가 남는다.
  //
  // CTA '뭉치 참여하기'는 수요 등록(B-09) 앞에 일정 타임라인을 거친다(FN-B09-05, BR-B09-05-01,
  // TC-B08-01-04). 두 화면 모두 상품 하나에서 출발하므로 경로가 이 상품 아래에 있다.
  return (
    <ProductDetailView
      key={productId}
      participateHref={`/products/${encodeURIComponent(productId)}/timeline`}
      product={product}
    />
  );
}
