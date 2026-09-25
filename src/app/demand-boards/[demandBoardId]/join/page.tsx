import type { Metadata } from 'next';

import { QUICK_JOIN } from '@/constants/demandBoardMessages';
import { QuickJoinView } from '@/features/demand/components/QuickJoinView';

export const metadata: Metadata = {
  title: QUICK_JOIN.appBarTitle,
};

// 퀵 참여(FN-B12-02). 뭉치 진행 과정 안내의 [확인]이 여기로 온다.
//
// 조회·제출은 세션이 필요해 QuickJoinView(client)가 한다.
//
// 생성 타입(PageProps)은 `next build` 전에 존재하지 않아 typecheck에서 깨지므로 params를 직접
// 타이핑한다.
export default async function QuickJoinPage({
  params,
}: {
  params: Promise<{ demandBoardId: string }>;
}) {
  const { demandBoardId } = await params;

  return (
    <QuickJoinView
      demandBoardId={demandBoardId}
      detailHref={`/demand-boards/${encodeURIComponent(demandBoardId)}`}
      notFoundHref="/"
      participationListHref="/waiting"
      paymentMethodsHref="/mypage/payment-methods"
    />
  );
}
