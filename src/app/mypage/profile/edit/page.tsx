import type { Metadata } from 'next';

import { AppBar } from '@/components/layout/AppBar';
import { LinkButton } from '@/features/user/components/LinkButton';
import { LogoutRow } from '@/features/user/components/LogoutRow';
import { SessionProfileCard } from '@/features/user/components/SessionProfileCard';
import { SettingsList } from '@/features/user/components/SettingsList';
import { SettingsRow } from '@/features/user/components/SettingsRow';
import { SettingsSection } from '@/features/user/components/SettingsSection';
import { WithdrawRow } from '@/features/user/components/WithdrawRow';

export const metadata: Metadata = {
  title: '프로필 설정',
};

// B-24 프로필 설정. 마이페이지의 프로필 카드 편집 아이콘으로 진입한다. `User-02` `User-03`.
//
// 상단 앱바는 B-25 알림 설정이 같은 모양을 쓰게 되어 `components/layout/AppBar`로 올렸다.
export default function ProfileEditPage() {
  return (
    <main className="flex w-full flex-col pb-6">
      <AppBar backHref="/mypage" title="프로필 설정" />

      <div className="flex w-full flex-col gap-6 p-4">
        <div className="bg-background-default rounded-12 flex w-full flex-col">
          {/* 프로필 카드는 전역 세션(GET /api/members/me)을 소비한다(#70). 마이페이지와 같은 조각을
              재사용하되, 여기선 편집 아이콘·역할 전환을 달지 않는다(경로를 넘기지 않음). */}
          <SessionProfileCard />
          <div className="flex w-full items-start gap-2.5 px-4 pb-4">
            {/* 프로필 사진 변경(FN-B24-04)·닉네임 변경(FN-B24-03) 모두 Full 범위라 화면이 없다. */}
            <LinkButton label="프로필 사진 변경" />
            <LinkButton label="닉네임 변경" />
          </div>
        </div>

        <SettingsSection title="계정 설정">
          <SettingsList>
            {/* 두 화면 모두 기능명세에 행이 없고 아직 만들지 않았다. API는 명세에 있으니
                범위가 확정되면 경로를 넣는다. */}
            <SettingsRow comingSoon label="회원정보 변경" />
            <SettingsRow comingSoon label="비밀번호 변경" />
            {/* 환불계좌는 기능 명세서에 근거가 없다. `User-09`는 판매자 정산 계좌다. PM 확인 필요. */}
            <SettingsRow comingSoon label="환불계좌 관리" />
            {/* 로그아웃(POST /api/auth/logout, #70)·회원탈퇴(DELETE /api/auth/withdraw, #91) 모두
                확인 다이얼로그를 거쳐 실제로 세션을 폐기하고 로그인 화면으로 replace 한다(BR-B24-01-04). */}
            <LogoutRow />
            <WithdrawRow />
          </SettingsList>
        </SettingsSection>
      </div>
    </main>
  );
}
