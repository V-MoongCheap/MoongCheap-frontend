import { MobileScreenShell } from '@/components/layout/MobileScreenShell';

// 수요 화면 셸(B-16 대체상품 수락 `/demands/[demandId]/substitute`). 모바일 전용 시안이라 상품·주문
// 셸과 같은 폭(393px)으로 중앙 고정하고 배경은 흰색이다 — 공용 MobileScreenShell 기본값 그대로.
// GNB 없이 앱바 뒤로 가기로만 빠져나오므로 BottomNav 그룹에 두지 않는다.
//
// B-12 수요 상세는 수요보드 id를 받아 `app/demand-boards/`로 옮겼다(#176, 그쪽 layout 주석 참고).
//
// 생성 타입(LayoutProps)은 `next build` 전에 존재하지 않아 typecheck에서 깨지므로 children을
// 직접 타이핑한다.
export default function DemandsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <MobileScreenShell>{children}</MobileScreenShell>;
}
