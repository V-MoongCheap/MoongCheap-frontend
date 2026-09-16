import { BottomNav } from '@/components/layout/BottomNav';

// 마이페이지 허브 셸. 허브(`/mypage`)는 하단 탭바(홈·대기·MY)의 목적지이자 탭 루트라 탭바를 입는다.
// 상세 화면(프로필 설정·배송지 등)은 뒤로가기 AppBar를 쓰는 push 화면이라 이 `(hub)` 그룹 밖에 두어
// 탭바를 붙이지 않는다. 탭바(fixed)와 하단 여백을 여기서 한곳에 두어, 페이지가 셸 책임을 인라인으로
// 지지 않게 한다. pb는 fixed 탭바(64) + 시안 여백(51) 만큼 비워 마지막 항목이 가리지 않게 한다.
//
// 생성 타입(LayoutProps)은 `next build` 전에 존재하지 않아 typecheck에서 깨지므로 children을 직접 타이핑한다.
export default function MyPageHubLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className="flex w-full flex-1 flex-col pb-[calc(115px+env(safe-area-inset-bottom))]">
        {children}
      </div>
      <BottomNav />
    </>
  );
}
