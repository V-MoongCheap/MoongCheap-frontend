import type { Metadata } from 'next';

import { LinkButton } from '@/features/user/components/LinkButton';
import { SessionOrderProgressSummary } from '@/features/user/components/SessionOrderProgressSummary';
import { SessionProfileCard } from '@/features/user/components/SessionProfileCard';
import { SettingsList } from '@/features/user/components/SettingsList';
import { SettingsRow } from '@/features/user/components/SettingsRow';
import { SettingsSection } from '@/features/user/components/SettingsSection';

export const metadata: Metadata = {
  title: '마이페이지',
};

// B-26 마이페이지(구매자). 하위 화면 전부의 진입점이다. `User-01`.
//
// 하단 탭바(홈·대기·MY)의 목적지이자 탭 루트라 `(hub)` 그룹에 두어 탭바 셸(../(hub)/layout)을 입는다.
// 상세 화면(프로필 설정·배송지 등)은 이 그룹 밖에 있어 탭바가 붙지 않는다.
//
// 페이지는 서버 컴포넌트다. 세션이 필요한 `SessionProfileCard`와 `SessionOrderProgressSummary`만
// client 경계를 만들고, 미구현 진입점의 '준비 중' 토스트는 `ComingSoonButton` 리프에서 만든다.
//
// 시안의 진입점 중 화면이 아직 없는 것이 많다. 링크로 두면 404가 나므로 경로를 비워 토스트로
// 돌린다(의사결정 기록 2026-08-28 "미구현 진입점 인터랙션은 토스트 일괄 표시").
export default function MyPage() {
  return (
    <main className="flex w-full flex-col">
      <header className="flex w-full flex-col gap-1 p-4">
        <h1 className="text-heading-24 text-content-primary w-full">마이페이지</h1>
      </header>

      <div className="flex w-full flex-col gap-6 px-4">
        {/* 프로필 카드는 전역 세션(GET /api/members/me)을 소비하는 client 컴포넌트다(#70). 조회 중·
            실패·미로그인 처리를 `SessionProfileCard`가 맡는다. 아래 주문 요약
            (`SessionOrderProgressSummary`)도 같은 이유로 client 경계이고, 나머지는 서버 렌더로 남는다.
            전환 버튼(시트)은 `SessionProfileCard`가 함께 그린다. 시트의 '판매자' 선택은 S-01로 보낸다
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
            <SessionOrderProgressSummary />
            <LinkButton label="취소/교환/반품 조회" />
          </div>
        </SettingsSection>

        <SettingsSection title="설정">
          <SettingsList>
            {/* 결제수단 등록(B-14)은 팀원 담당분이라 아직 화면이 없다. */}
            <SettingsRow comingSoon label="결제수단 등록 • 변경" />
            <SettingsRow href="/mypage/addresses" label="배송지 관리" />
            <SettingsRow href="/mypage/notifications/settings" label="알림설정" />
            {/* 찜은 시안의 마이페이지 목록에 없는 항목이다. 화면도 시안이 없어 경로만 만들어 두고
                그 화면 안에서 준비 중임을 알린다. 라벨은 확정 문구가 아니라 임의로 정한 것이라
                디자인·PM 확인 후 바꾼다. */}
            <SettingsRow href="/mypage/wishlist" label="찜한 상품" />
            {/* 고객센터·1:1 문의는 기능 명세서에 요구사항이 없다. 디자인팀이 임의로 넣은 항목이라
                화면만 그리고 탭하면 준비 중 토스트를 띄운다. PM 확인 후 경로를 넣는다. */}
            <SettingsRow comingSoon label="고객센터" />
            <SettingsRow comingSoon label="1:1 문의" />
          </SettingsList>
        </SettingsSection>
      </div>
    </main>
  );
}
