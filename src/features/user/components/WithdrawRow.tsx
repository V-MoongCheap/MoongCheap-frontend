'use client';

import { WITHDRAW_CONFIRM } from '@/constants/commonMessages';
import { useWithdraw } from '@/features/auth/session';
import { SessionActionRow } from '@/features/user/components/SessionActionRow';

// B-24 회원탈퇴 실행 행(#91). 확인 → DELETE /api/auth/withdraw → 로그인 화면 replace 흐름은
// SessionActionRow에 모여 있고, 여기선 회원탈퇴 고유의 문구·뮤테이션만 넘긴다.

const WITHDRAW_FAILED_MESSAGE = '회원탈퇴에 실패했어요. 잠시 후 다시 시도해 주세요.';

export function WithdrawRow() {
  const mutation = useWithdraw();

  return (
    <SessionActionRow
      label="회원탈퇴"
      confirm={WITHDRAW_CONFIRM}
      failureMessage={WITHDRAW_FAILED_MESSAGE}
      mutation={mutation}
    />
  );
}
