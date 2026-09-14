'use client';

import { LOGOUT_CONFIRM } from '@/constants/commonMessages';
import { useLogout } from '@/features/auth/session';
import { SessionActionRow } from '@/features/user/components/SessionActionRow';

// B-24 로그아웃 실행 행(#70). 확인 → 폐기 → 로그인 화면 replace 흐름은 SessionActionRow에 모여
// 있고, 여기선 로그아웃 고유의 문구·뮤테이션만 넘긴다.

const LOGOUT_FAILED_MESSAGE = '로그아웃에 실패했어요. 잠시 후 다시 시도해 주세요.';

export function LogoutRow() {
  const mutation = useLogout();

  return (
    <SessionActionRow
      label="로그아웃"
      confirm={LOGOUT_CONFIRM}
      failureMessage={LOGOUT_FAILED_MESSAGE}
      mutation={mutation}
    />
  );
}
