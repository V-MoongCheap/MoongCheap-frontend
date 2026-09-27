import type { Metadata } from 'next';

import { AppBar } from '@/components/layout/AppBar';
import { SUBSTITUTE_OFFER_COPY } from '@/constants/substituteOffer';
import { SubstituteOfferView } from '@/features/participation/components/SubstituteOfferView';

export const metadata: Metadata = {
  title: SUBSTITUTE_OFFER_COPY.title,
};

// B-16 대체상품 수락/거절. B-17 확인필요 탭의 대체상품 제안 카드 → 이 화면(FN-B16-01).
//
// 수요 세그먼트(`/demands/[demandId]/substitute`)에 둔다 — 특정 수요의 대체 제안 상세다
// (셸은 demands/layout, MobileScreenShell). backHref는 목록(/waiting)으로.
//
// 조회·수락·거절은 SubstituteOfferView(client)가 실API로 직접 한다 — 세션(SID httpOnly 쿠키)이
// 필요해 서버 컴포넌트에서 부르면 401이 된다(`lib/demandApi.ts` 주석).
//
// 생성 타입(PageProps)은 `next build` 전에 존재하지 않아 typecheck에서 깨지므로 params를 직접
// 타이핑한다(app/products/[productId]/page.tsx와 같은 이유).
export default async function SubstituteOfferPage({
  params,
}: {
  params: Promise<{ demandId: string }>;
}) {
  const { demandId } = await params;

  return (
    <main className="flex w-full flex-1 flex-col">
      <AppBar backHref="/waiting" title={SUBSTITUTE_OFFER_COPY.title} />
      <SubstituteOfferView demandId={demandId} listHref="/waiting" />
    </main>
  );
}
