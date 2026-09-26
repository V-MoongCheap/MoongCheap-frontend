import type { Metadata } from 'next';

import { AppBar } from '@/components/layout/AppBar';
import { AwardResultView } from '@/features/participation/components/AwardResultView';

export const metadata: Metadata = {
  title: '낙찰 결과',
};

const LIST_HREF = '/waiting';

// B-19 낙찰 성공 정보. 내 뭉치 참여 목록(B-17) 카드 → 낙찰 결과 확인으로 이어지는 화면.
//
// 경로 파라미터가 **수요 id가 아니라 수요보드 id**다. 백엔드 조회가 보드 기준이라
// (`GET /api/demand-boards/{demandBoardId}/auction-result`) 목록 카드가 `demandBoardId`를 넘긴다.
// backHref는 목록(B-17, /waiting)으로 되돌린다.
//
// 조회는 AwardResultView(client)가 세션 쿠키로 한다. 세션이 SID httpOnly 쿠키라 서버 컴포넌트에서
// 부르면 401이기 때문이다(`lib/auctionResultApi.ts`). 서버에서 mock을 먼저 그리지 않는다(#187).
//
// 생성 타입(PageProps)은 `next build` 전에 존재하지 않아 typecheck에서 깨지므로 직접 타이핑한다.
export default async function AwardResultPage({
  params,
}: {
  params: Promise<{ demandBoardId: string }>;
}) {
  const { demandBoardId } = await params;

  return (
    <main className="max-w-mobile bg-background-default mx-auto flex min-h-svh w-full flex-col">
      <AppBar backHref={LIST_HREF} title="낙찰 결과" />
      <AwardResultView demandBoardId={demandBoardId} listHref={LIST_HREF} />
    </main>
  );
}
