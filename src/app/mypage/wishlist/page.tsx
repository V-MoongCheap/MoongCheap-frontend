import { Heart } from 'lucide-react';
import type { Metadata } from 'next';

import { AppBar } from '@/components/layout/AppBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { COMING_SOON_MESSAGE } from '@/constants/commonMessages';

export const metadata: Metadata = {
  title: '찜한 상품',
};

// 찜 목록. 마이페이지 설정에서 진입한다.
//
// ⚠️ **자리만 잡은 화면이다.** 찜은 IA에도 기능명세에도 요구사항이 없고 시안도 없다. 상품 카드의
// 하트(`WishButton`)와 같은 시안 전용 진입점인데, 이동 경로는 있어야 한다고 전달받아 경로와
// 진입점만 만들었다.
//
// 시안이 없으므로 화면 문구를 새로 만들지 않고 이미 확정된 '준비 중인 기능이에요'를 그대로 쓴다
// (기능정의서 머리말 — 미구현 기능의 진입점은 노출하되 탭 시 그 문구를 노출한다). 다른 미구현
// 진입점은 토스트로 처리하지만, 여기는 경로가 실제로 존재해야 해서 화면 안에 같은 문구를 둔다.
//
// 목록 UI와 찜 토글 API가 정해지면 EmptyState 자리를 실제 목록으로 바꾼다.
export default function WishlistPage() {
  return (
    <main className="bg-background-default flex w-full flex-1 flex-col">
      <AppBar backHref="/mypage" title="찜한 상품" />
      <EmptyState
        className="flex-1"
        icon={<Heart aria-hidden className="size-12" />}
        title={COMING_SOON_MESSAGE}
      />
    </main>
  );
}
