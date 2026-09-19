'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { AlertDialog } from '@/components/ui/AlertDialog';
import { useToast } from '@/components/ui/Toast';
import { SETTINGS_ROW_PRESSABLE_CLASS } from '@/features/user/components/SettingsRow';
import { ApiError } from '@/lib/api';

// B-24 계정 설정에서 확인 다이얼로그를 거쳐 세션을 폐기하는 행. 로그아웃(#70)·회원탈퇴(#91)가
// 흐름이 같아(확인 → 뮤테이션 → 성공 시 로그인 화면 replace → 실패 토스트) 이 한 곳에 모은다.
// 각 행 고유의 문구·뮤테이션만 얇은 래퍼(LogoutRow·WithdrawRow)가 넘긴다.
//
// 완료 조건 "뒤로가기로 재진입 불가"(FN-B24-02)에 맞춰 성공 시 로그인 화면으로 replace 한다.
// 실패는 토스트로 알리고 화면에 머문다. 문구는 서버가 사유를 줬는지에 따라 갈린다
// (`resolveFailureMessage`). SettingsList의 <ul> 안에 놓이므로 <li>로 감싼다.

interface ConfirmCopy {
  title: string;
  message: string;
  confirmLabel: string;
}

/**
 * 실패 토스트에 띄울 문구를 고른다.
 *
 * 4xx는 같은 요청을 다시 보내도 결과가 같은 거부다(회원탈퇴의 `AUTH_014` "진행 중인 거래가 있어
 * 탈퇴할 수 없습니다."가 그렇다). 여기서 "잠시 후 다시 시도" 안내를 띄우면 성공할 수 없는 행동을
 * 시키는 셈이라, 서버가 보낸 사유를 그대로 보여 준다. 5xx와 네트워크 오류(status 0)는 재시도가
 * 의미 있으므로 호출부의 재시도 안내를 유지한다.
 *
 * 서버가 준 문구인지는 `code`로 가린다. 실패 본문이 규격을 벗어나면(빈 본문·게이트웨이가 준 HTML)
 * `toApiError`가 '요청이 실패했습니다(HTTP 400).' 같은 문장을 대신 채워 넣는데, 그것을 그대로
 * 띄우면 지금 문구보다 못하다. 그 경우 `code`는 null이라 여기서 걸러진다.
 */
function resolveFailureMessage(error: Error, fallback: string): string {
  if (!(error instanceof ApiError) || error.code === null) {
    return fallback;
  }
  return error.status >= 400 && error.status <= 499 ? error.message : fallback;
}

interface SessionActionRowProps {
  /** 행 라벨 = 다이얼로그를 여는 버튼 문구. */
  label: string;
  /** 확인 다이얼로그 문구. `constants/commonMessages`의 상수를 그대로 넘긴다. */
  confirm: ConfirmCopy;
  /** 실패 시 띄우는 토스트 문구. 서버가 사유를 주지 않았을 때만 쓰인다(`resolveFailureMessage`). */
  failureMessage: string;
  /**
   * 세션을 폐기하는 뮤테이션(useLogout·useWithdraw). 성공하면 세션 캐시는 이미 비워져 있으므로,
   * 여기서는 화면 이동(로그인 화면 replace)만 맡는다.
   */
  mutation: {
    mutate: (
      variables: void,
      options: { onSuccess: () => void; onError: (error: Error) => void },
    ) => void;
    isPending: boolean;
  };
}

export function SessionActionRow({
  label,
  confirm,
  failureMessage,
  mutation,
}: SessionActionRowProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { mutate, isPending } = mutation;
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = () => {
    if (isPending) {
      return;
    }
    mutate(undefined, {
      onSuccess: () => {
        setIsOpen(false);
        // 세션 캐시는 뮤테이션이 비웠다. 로그인 화면으로 replace 해 뒤로가기 재진입을 막는다.
        router.replace('/login');
      },
      onError: (error) => {
        setIsOpen(false);
        showToast(resolveFailureMessage(error, failureMessage));
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
        {label}
      </button>

      <AlertDialog
        isOpen={isOpen}
        title={confirm.title}
        message={confirm.message}
        confirmLabel={confirm.confirmLabel}
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
