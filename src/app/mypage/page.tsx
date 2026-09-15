import type { Metadata } from 'next';

import { BottomNav } from '@/components/layout/BottomNav';
import { LinkButton } from '@/features/user/components/LinkButton';
import { OrderProgressSummary } from '@/features/user/components/OrderProgressSummary';
import { SessionProfileCard } from '@/features/user/components/SessionProfileCard';
import { SettingsList } from '@/features/user/components/SettingsList';
import { SettingsRow } from '@/features/user/components/SettingsRow';
import { SettingsSection } from '@/features/user/components/SettingsSection';
import { mockGetMyPageOverview } from '@/mocks/user';

export const metadata: Metadata = {
  title: '마이페이지',
};

// B-26 마이페이지(구매자). 하위 화면 전부의 진입점이다. `User-01`.
//
// 페이지는 서버 컴포넌트다. 미구현 진입점의 '준비 중' 토스트는 `ComingSoonButton` 리프에서만
// 클라이언트 경계를 만든다.
//
// 시안의 진입점 중 화면이 아직 없는 것이 많다. 링크로 두면 404가 나므로 경로를 비워 토스트로
// 돌린다(의사결정 기록 2026-08-28 "미구현 진입점 인터랙션은 토스트 일괄 표시").
export default async function MyPage() {
  const overview = await mockGetMyPageOverview();

  return (
    <>
      {/* 마이페이지 허브는 하단 탭바(홈·대기·MY)의 목적지이자 탭 루트다. 상세 화면(프로필 설정·배송지
          등)은 뒤로가기 AppBar를 쓰는 push 화면이라 탭바를 붙이지 않으므로, 공통 셸(mypage/layout)이
          아니라 이 허브 페이지에서만 렌더한다. pb는 fixed 탭바(64) + 시안 여백(51) 만큼 비워 마지막
          항목이 가리지 않게 한다((main) 셸과 동일 실측값). */}
      <main className="flex w-full flex-col pb-[calc(115px+env(safe-area-inset-bottom))]">
        <header className="flex w-full flex-col gap-1 p-4">
          <h1 className="text-heading-24 text-content-primary w-full">마이페이지</h1>
        </header>

        <div className="flex w-full flex-col gap-6 px-4">
          {/* 프로필 카드는 전역 세션(GET /api/members/me)을 소비하는 client 조각이다(#70). 조회 중·
            실패·미로그인 처리를 이 안에서 하고, 나머지(주문 요약 등)는 서버 렌더로 남는다.
            전환 버튼(시트)은 그 안에서 함께 그린다 — 시트의 '판매자' 선택은 S-01로 보낸다
            (기능명세 FN-B26-01이 판매자 전환을 미확정으로 남겨, IA의 판매자 전환 → S-01 매핑을 따랐다). */}
          <SessionProfileCard
            editHref="/mypage/profile/edit"
            sellerApplyHref="/mypage/seller-apply"
          />

          {/* 진행 단계 숫자를 탭하면 해당 상태로 필터된 B-21로 가야 한다(BR-B21-01-09). 다만 명세가
            "세부 상태까지 필터할지"를 [⚠️ 기능·화면 미확정] 11번으로 남겨 둬 숫자는 아직 링크가 아니다.
            취소/교환/반품 조회는 MVP 미구현이라 준비 중 토스트를 유지한다(BR-B21-01-09). */}
          <SettingsSection actionHref="/orders" actionLabel="자세히보기" title="진행중인 주문내역">
            <div className="flex w-full flex-col gap-1.5">
              <OrderProgressSummary counts={overview.orderProgress} />
              <LinkButton label="취소/교환/반품 조회" />
            </div>
          </SettingsSection>

          <SettingsSection title="설정">
            <SettingsList>
              {/* 결제수단 등록(B-14)은 팀원 담당분이라 아직 화면이 없다. */}
              <SettingsRow comingSoon label="결제수단 등록 • 변경" />
              <SettingsRow href="/mypage/addresses" label="배송지 관리" />
              <SettingsRow href="/mypage/notifications/settings" label="알림설정" />
              {/* 고객센터·1:1 문의는 기능 명세서에 요구사항이 없다. 디자인팀이 임의로 넣은 항목이라
                화면만 그리고 탭하면 준비 중 토스트를 띄운다. PM 확인 후 경로를 넣는다. */}
              <SettingsRow comingSoon label="고객센터" />
              <SettingsRow comingSoon label="1:1 문의" />
            </SettingsList>
          </SettingsSection>
        </div>
      </main>
      <BottomNav />
    </>
  );
}
