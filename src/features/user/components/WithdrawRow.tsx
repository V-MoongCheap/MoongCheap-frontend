'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { AlertDialog } from '@/components/ui/AlertDialog';
import { useToast } from '@/components/ui/Toast';
import { WITHDRAW_CONFIRM } from '@/constants/commonMessages';
import { useWithdraw } from '@/features/auth/session';
import { SETTINGS_ROW_PRESSABLE_CLASS } from '@/features/user/components/SettingsRow';

// B-24 회원탈퇴 실행 행(#91). 로그아웃 행(LogoutRow)과 같은 구조다 — 확인 다이얼로그를 거쳐
// DELETE /api/auth/withdraw로 계정을 탈퇴하고, 세션 캐시를 비워 전역 상태를 미로그인으로 만든 뒤
// (useWithdraw), 로그인 화면으로 replace 해 히스토리에서 마이페이지를 지운다(BR-B24-01-04).
// 실패는 토스트로 알리고 화면에 머문다(재시도 가능). SettingsList의 <ul> 안에 놓이므로 <li>로 감싼다.

const WITHDRAW_FAILED_MESSAGE = '회원탈퇴에 실패했어요. 잠시 후 다시 시도해 주세요.';

export function WithdrawRow() {
  const router = useRouter();
  const { showToast } = useToast();
  const { mutate, isPending } = useWithdraw();
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = () => {
    if (isPending) {
      return;
    }
    mutate(undefined, {
      onSuccess: () => {
        setIsOpen(false);
        // 세션 캐시는 useWithdraw가 비웠다. 로그인 화면으로 replace 해 뒤로가기 재진입을 막는다.
        router.replace('/login');
      },
      onError: () => {
        setIsOpen(false);
        showToast(WITHDRAW_FAILED_MESSAGE);
      },
    });
  };

  return (
    <li className="w-full">
      <button
        className={SETTINGS_ROW_PRESSABLE_CLASS}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        회원탈퇴
      </button>

      <AlertDialog
        isOpen={isOpen}
        title={WITHDRAW_CONFIRM.title}
        message={WITHDRAW_CONFIRM.message}
        confirmLabel={WITHDRAW_CONFIRM.confirmLabel}
        isProcessing={isPending}
        onConfirm={handleConfirm}
        onClose={() => {
          // 처리 중에는 닫기(취소·Esc·백드롭)를 막아 이중 실행·중도 이탈을 방지한다.
          if (!isPending) {
            setIsOpen(false);
          }
        }}
      />
    </li>
  );
}
