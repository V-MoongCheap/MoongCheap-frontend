import type { Metadata } from 'next';

import { DEMAND_GUIDE } from '@/constants/demandGuide';
import { DemandGuideView } from '@/features/demand/components/DemandGuideView';

// 탭 타이틀은 화면에 보이는 제목과 일치시킨다(단일 소스 DEMAND_GUIDE.title).
export const metadata: Metadata = {
  title: DEMAND_GUIDE.title,
};

// 일정 타임라인 안내(FN-B09-05). B-08 상품 상세의 하단 CTA가 여기로 온다.
//
// 명세가 수요 등록(B-09) 앞에 이 화면을 거치도록 고정했다(BR-B09-05-01, TC-B08-01-04).
// [확인]을 누르면 같은 상품의 수요 등록으로 간다. 상품 하나에서 출발하는 흐름이라 B-09와 같이
// 상품 경로 아래에 둔다. 화면 셸은 `app/products/layout.tsx`가 그린다.
//
// 생성 타입(PageProps)은 `next build` 전에 존재하지 않아 typecheck에서 깨지므로 params를 직접
// 타이핑한다(app/products/[productId]/page.tsx와 같은 이유).
export default async function ProductTimelinePage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  return <DemandGuideView nextHref={`/products/${encodeURIComponent(productId)}/demand`} />;
}
