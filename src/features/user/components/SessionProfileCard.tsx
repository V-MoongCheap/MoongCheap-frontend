'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useSession } from '@/features/auth/session';
import { ProfileCard, PROFILE_CARD_CONTAINER_CLASS } from '@/features/user/components/ProfileCard';
import { RoleSwitchButton } from '@/features/user/components/RoleSwitchButton';
import type { UserRole } from '@/types/auth';
import type { ActiveRole } from '@/types/user';

// 전역 세션(#70)에서 프로필 카드를 그리는 client 조각. 마이페이지(B-26)·프로필 설정(B-24)이
// 함께 쓴다. 두 화면 모두 로그인 뒤에만 보이는 보호 화면이라, 미로그인이면 로그인 화면으로 돌린다.
//
// mock이 아니라 GET /api/members/me의 실제 세션을 소비하는 첫 지점이다.
// 서버 페이지는 그대로 두고 이 카드만 client 경계로 잘라, 조회 중/실패/미로그인 상태를 이 안에서
// 처리한다(홈 피드의 영역별 스켈레톤과 같은 방침).

interface SessionProfileCardProps {
  /** 프로필 수정 진입 경로. 넘기지 않으면 편집 아이콘을 감춘다(ProfileCard와 동일 규칙). */
  editHref?: string;
  /** 역할 전환 버튼의 판매자 전환(S-01) 경로. 넘기면 전환 pill을 노출한다(마이페이지만 넘긴다). */
  sellerApplyHref?: string;
}

/** 세션 role(계정 권한)을 마이페이지의 활성 역할 축으로 옮긴다.
 *  ActiveRole은 원래 "지금 보고 있는 모드"라 세션의 계정 권한과 축이 다르지만, 역할 전환 토글
 *  상태를 담을 client 스토어가 아직 없어 계정 권한으로 대신한다(전환 UI 배선 시 재검토). */
function toActiveRole(role: UserRole): ActiveRole {
  return role === 'SELLER' ? 'seller' : 'buyer';
}

export function SessionProfileCard({ editHref, sellerApplyHref }: SessionProfileCardProps) {
  const router = useRouter();
  const { user, isPending, isError, refetch } = useSession();

  // 미로그인(user === null)이면 로그인 화면으로 돌린다. 렌더 중 이동은 안 되므로 effect에서 처리하고,
  // 그동안은 자리표시자를 유지해 화면 깜빡임을 막는다. isPending 동안은 아직 판정 전이라 두지 않는다.
  const loggedOut = !isPending && !isError && user === null;
  useEffect(() => {
    if (loggedOut) {
      router.replace('/login');
    }
  }, [loggedOut, router]);

  if (isPending) {
    return <ProfileCardSkeleton />;
  }

  if (isError || user === undefined) {
    // 미로그인이 아니라 조회 실패(네트워크·5xx). 카드 자리에 재시도만 둔다(나머지 화면은 그대로).
    return <ErrorState onRetry={refetch} className="py-8" />;
  }

  if (user === null) {
    // 미로그인. 위 effect가 로그인 화면으로 보내는 동안 자리표시자를 유지한다(깜빡임 방지).
    return <ProfileCardSkeleton />;
  }

  return (
    <ProfileCard
      editHref={editHref}
      email={user.email}
      nickname={user.nickname}
      roleSwitch={
        sellerApplyHref !== undefined ? (
          <RoleSwitchButton
            currentRole={toActiveRole(user.role)}
            sellerApplyHref={sellerApplyHref}
          />
        ) : undefined
      }
    />
  );
}

/** ProfileCard와 같은 크기의 로딩 자리표시자(아바타 + 두 줄). 컨테이너는 ProfileCard와 공유한다. */
function ProfileCardSkeleton() {
  return (
    <section className={PROFILE_CARD_CONTAINER_CLASS}>
      <Skeleton className="rounded-round size-16 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-40" />
      </div>
    </section>
  );
}
