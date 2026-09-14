import { DemandFormView } from '@/features/demand/components/DemandFormView';
import { mockGetProductDetail } from '@/mocks/product';

// B-09 수요 등록/참여. 상품 상세(B-08)의 하단 CTA `뭉치 참여하기`가 여기로 온다.
//
// 경로를 상품 아래에 둔 이유는 이 화면이 항상 상품 하나에서 출발하기 때문이다. 제품 상세 섹션이
// 그 상품을 그린다. 라우팅 규약이 확정되면 바뀔 수 있다.
//
// 생성 타입(PageProps)은 `next build` 전에 존재하지 않아 typecheck에서 깨지므로 직접 타이핑한다.

export default async function DemandFormPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  // 상품 조회는 상품 상세(B-08)와 같은 방식이다. 규격이 나오면 목만 교체한다.
  const product = await mockGetProductDetail(productId);

  return <DemandFormView backHref={`/products/${productId}`} product={product} />;
}
