import { MobileScreenShell } from '@/components/layout/MobileScreenShell';

// 수요보드 화면 셸(B-12 수요 상세 · 진행 과정 안내 · 퀵 참여). 모바일 전용 컬럼이라 상품·수요 셸과
// 같은 폭으로 중앙 고정한다. 하단 고정 CTA가 이 컬럼 안에서 붙으므로 BottomNav 그룹에 두지 않는다.
//
// `/demands/[demandId]`가 아니라 이 세그먼트에 두는 이유: `/demands/[demandId]/substitute`(B-16)의
// id는 수요 id이고, 이 화면들의 id는 수요보드 id다. 같은 자리에 이름이 다른 동적 세그먼트를 둘 수
// 없고, 같은 이름으로 두 가지 id를 받으면 헷갈린다. 경로도 백엔드(`/api/demand-boards/{id}`)와 맞춘다.
//
// 생성 타입(LayoutProps)은 `next build` 전에 존재하지 않아 typecheck에서 깨지므로 children을
// 직접 타이핑한다.
export default function DemandBoardsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <MobileScreenShell>{children}</MobileScreenShell>;
}
