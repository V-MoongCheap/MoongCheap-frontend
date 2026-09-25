import type { Metadata } from 'next';

import { DEMAND_GUIDE } from '@/constants/demandGuide';
import { DemandGuideView } from '@/features/demand/components/DemandGuideView';

// 탭 타이틀은 화면에 보이는 제목과 일치시킨다(단일 소스 DEMAND_GUIDE.title).
export const metadata: Metadata = {
  title: DEMAND_GUIDE.title,
};

// 뭉치 진행 과정 안내(FN-B09-05). 수요 상세(B-12)의 [함께 신청하기]가 여기로 온다.
// [확인]을 누르면 같은 수요보드의 퀵 참여로 간다(`DemandGuideView` 주석의 두 번째 진입점).
//
// 생성 타입(PageProps)은 `next build` 전에 존재하지 않아 typecheck에서 깨지므로 params를 직접
// 타이핑한다.
export default async function DemandBoardTimelinePage({
  params,
}: {
  params: Promise<{ demandBoardId: string }>;
}) {
  const { demandBoardId } = await params;

  return <DemandGuideView nextHref={`/demand-boards/${encodeURIComponent(demandBoardId)}/join`} />;
}
