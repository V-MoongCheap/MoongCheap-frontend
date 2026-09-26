import type { Metadata } from 'next';

import { DEMAND_BOARD_DETAIL } from '@/constants/demandBoardMessages';
import { DemandBoardDetailView } from '@/features/demand/components/DemandBoardDetailView';

export const metadata: Metadata = {
  title: DEMAND_BOARD_DETAIL.appBarTitle,
};

// B-12 수요 상세(MC-B12-01). 상품 상세(B-08)의 퀵 참여 카드에서 들어온다.
//
// 조회는 세션(SID httpOnly 쿠키)이 필요해 DemandBoardDetailView(client)가 한다.
//
// 생성 타입(PageProps)은 `next build` 전에 존재하지 않아 typecheck에서 깨지므로 params를 직접
// 타이핑한다(app/products/[productId]/page.tsx와 같은 이유).
export default async function DemandBoardDetailPage({
  params,
}: {
  params: Promise<{ demandBoardId: string }>;
}) {
  const { demandBoardId } = await params;
  const base = `/demand-boards/${encodeURIComponent(demandBoardId)}`;

  return (
    <DemandBoardDetailView
      // 공유·직접 진입이면 뒤로 갈 곳이 없어 홈을 준다(명세 '홈 복귀').
      backHref="/"
      demandBoardId={demandBoardId}
      // [함께 신청하기] → 뭉치 진행 과정 안내 → 퀵 참여. 수요 등록(B-08 → 안내 → B-09)과 같은 흐름이다.
      joinHref={`${base}/timeline`}
      notFoundHref="/"
      participationListHref="/waiting"
      productHrefBase="/products"
    />
  );
}
