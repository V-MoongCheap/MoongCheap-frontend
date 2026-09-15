'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { DIALOG_BUTTON_CLASS } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/Toast';
import { AUTH_ERROR_MESSAGES, AUTH_SUCCESS_MESSAGES } from '@/constants/authMessages';
import { useSession, useUpdateNickname } from '@/features/auth/session';
import { LINK_BUTTON_CLASS } from '@/features/user/components/LinkButton';
import { ApiError } from '@/lib/api';
import { checkNicknameAvailability } from '@/lib/authApi';
import { cn } from '@/lib/cn';
import { signupNicknameSchema } from '@/schemas/auth';

// B-24 닉네임 변경(FN-B24-03). 프로필 설정의 "닉네임 변경" 버튼을 눌러 모달로 처리한다.
// 흐름: 입력 → 중복확인 → 변경 → PATCH /api/members/me → 모달 닫히며 프로필 카드에 반영.
//
// 화면(라우트)이 아니라 모달인 이유는 입력 1개짜리 단발 동작이기 때문이다. AlertDialog는 메시지
// 전용(입력칸 슬롯이 없다)이라, 같은 네이티브 <dialog> 패턴으로 입력형 다이얼로그를 여기 둔다.
// 닉네임 규칙·중복확인·성공/오류 문구는 회원가입 닉네임 스텝과 동일 모듈(schemas/auth·authMessages·
// checkNicknameAvailability)을 재사용해 규칙이 바뀌면 한곳만 고치면 된다.
//
// 프리필하지 않는다: 중복확인(GET .../availability)은 활성 회원 전체를 보므로 본인 현재 닉네임도
// "사용 중"으로 나온다. 빈 입력 + placeholder로 시작하고, 현재 닉네임은 안내 문구로만 보여준다
// (회원가입 닉네임 스텝과 동일 규칙).

const NICKNAME_CHANGED_MESSAGE = '닉네임이 변경되었어요.';
const NICKNAME_FAILED_MESSAGE = '닉네임 변경에 실패했어요. 잠시 후 다시 시도해 주세요.';
const NICKNAME_CHECK_FAILED_MESSAGE =
  '닉네임 확인 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.';
const SESSION_EXPIRED_MESSAGE = '세션이 만료되었어요. 다시 로그인해 주세요.';

export function NicknameChangeButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button className={LINK_BUTTON_CLASS} onClick={() => setIsOpen(true)} type="button">
        닉네임 변경
      </button>
      {/* 조건부 마운트로 열 때마다 입력·중복확인 상태를 새로 시작한다(직전 입력이 남지 않게). */}
      {isOpen && <NicknameEditDialog onClose={() => setIsOpen(false)} />}
    </>
  );
}

/** 중복확인 결과. forValue는 어떤 값에 대해 확인했는지 — 값을 고치면 통과를 무효화하는 데 쓴다. */
type NicknameCheck = {
  state: 'idle' | 'checking' | 'available' | 'taken';
  forValue: string;
};

function NicknameEditDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // 중복확인 진행 여부. state가 아니라 ref인 이유는 같은 렌더에서 발생한 두 트리거(버튼 클릭 +
  // Enter)가 각각 렌더 시점의 check.state를 보고 둘 다 통과해 요청이 두 번 나가는 것을 막기 위함이다
  // (ref는 즉시 반영돼 동기 이중 호출을 차단한다).
  const checkingRef = useRef(false);
  const id = useId();
  const inputId = `${id}-nickname`;
  const helperId = `${id}-helper`;

  const { user } = useSession();
  const { showToast } = useToast();
  const mutation = useUpdateNickname();

  const [nickname, setNickname] = useState('');
  const [check, setCheck] = useState<NicknameCheck>({ state: 'idle', forValue: '' });

  // 마운트 시 모달로 연다. showModal()이라야 백드롭·포커스 트랩·Esc 닫힘이 브라우저 기본으로 붙는다.
  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const isPending = mutation.isPending;
  const formatValid = signupNicknameSchema.safeParse(nickname).success;
  // 확인 후 값을 고치면(forValue 불일치) 결과를 idle로 되돌려 다시 확인하게 한다.
  const resolved = check.forValue === nickname ? check.state : 'idle';
  const passed = resolved === 'available';

  const status: 'default' | 'success' | 'error' =
    resolved === 'available' ? 'success' : resolved === 'taken' ? 'error' : 'default';
  const helper =
    status === 'success'
      ? AUTH_SUCCESS_MESSAGES.confirmed
      : status === 'error'
        ? AUTH_ERROR_MESSAGES.nickname.taken
        : undefined;

  // 처리 중에는 닫기(취소·Esc·백드롭)를 막아 이중 실행·중도 이탈을 방지한다. close()로 닫아야
  // 네이티브 dialog 닫힘 절차(트리거로 포커스 복원)가 실행된다 — 언마운트만으로는 복원되지 않는다.
  // 닫힘은 <dialog onClose>가 받아 부모에 onClose로 전달한다.
  const requestClose = () => {
    if (!isPending) {
      dialogRef.current?.close();
    }
  };

  const handleCheck = async () => {
    const trimmed = nickname.trim();
    if (checkingRef.current || trimmed.length === 0 || !formatValid) {
      return;
    }
    if (trimmed !== nickname) {
      setNickname(trimmed);
    }
    checkingRef.current = true;
    setCheck({ state: 'checking', forValue: trimmed });
    try {
      const available = await checkNicknameAvailability(trimmed);
      setCheck({ state: available ? 'available' : 'taken', forValue: trimmed });
    } catch (error) {
      // 통과 상태로 두면 안 되므로 idle로 되돌리고 토스트로 알린다.
      setCheck({ state: 'idle', forValue: '' });
      showToast(
        error instanceof ApiError && error.status === 401
          ? SESSION_EXPIRED_MESSAGE
          : NICKNAME_CHECK_FAILED_MESSAGE,
      );
    } finally {
      checkingRef.current = false;
    }
  };

  const handleSubmit = () => {
    if (!passed || isPending) {
      return;
    }
    mutation.mutate(nickname.trim(), {
      onSuccess: () => {
        // close()로 닫아 네이티브 닫힘 절차(포커스 복원)를 태운다. onClose는 <dialog onClose>가 받는다.
        dialogRef.current?.close();
        showToast(NICKNAME_CHANGED_MESSAGE);
      },
      onError: (error) => {
        // 중복확인 뒤 제출 전에 다른 유저가 선점하면 409(USER_002). 인라인으로 "사용 중"을 다시
        // 표시하고 모달은 열어 둔다(다른 닉네임으로 재시도). 그 외는 토스트로 알린다.
        if (error instanceof ApiError && error.status === 409) {
          setCheck({ state: 'taken', forValue: nickname.trim() });
          return;
        }
        showToast(
          error instanceof ApiError && error.status === 401
            ? SESSION_EXPIRED_MESSAGE
            : NICKNAME_FAILED_MESSAGE,
        );
      },
    });
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      // Esc·백드롭으로 닫으려 할 때 처리 중이면 취소한다(닫힘 이벤트 자체를 막는다).
      onCancel={(event) => {
        if (isPending) {
          event.preventDefault();
        }
      }}
      aria-labelledby={`${id}-title`}
      className="bg-surface-primary rounded-32 m-auto w-[calc(100%-54px)] max-w-85 p-0 backdrop:bg-black/40"
    >
      <div className="flex flex-col gap-5 p-5">
        <div className="flex flex-col gap-2">
          <p className="text-title-17 text-content-primary" id={`${id}-title`}>
            닉네임 변경
          </p>
          {user != null && (
            <p className="text-body-14 text-content-quarternary">
              현재 닉네임은 <span className="text-content-primary">{user.nickname}</span> 이에요.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="relative">
            <label
              htmlFor={inputId}
              className="text-content-quarternary bg-surface-primary text-caption-12 absolute -top-2 left-3 px-1"
            >
              새 닉네임
            </label>
            <input
              id={inputId}
              type="text"
              autoComplete="off"
              placeholder="새 닉네임을 입력해주세요."
              value={nickname}
              aria-invalid={status === 'error'}
              aria-describedby={helper !== undefined ? helperId : undefined}
              onChange={(event) => {
                setNickname(event.target.value);
                // 값을 고치면 직전 중복확인 결과를 무효화한다(다시 확인해야 변경 가능).
                setCheck({ state: 'idle', forValue: '' });
              }}
              onKeyDown={(event) => {
                // IME 조합 확정(한글)의 Enter는 무시. 통과면 변경, 아니면 중복확인으로 흘린다.
                if (event.key !== 'Enter' || event.nativeEvent.isComposing) {
                  return;
                }
                event.preventDefault();
                if (passed) {
                  handleSubmit();
                } else if (formatValid) {
                  void handleCheck();
                }
              }}
              className={cn(
                'placeholder:text-content-quinary rounded-8 text-body-14 h-14 w-full border pr-28 pl-4 outline-none',
                status === 'success'
                  ? 'border-border-success'
                  : status === 'error'
                    ? 'border-border-error'
                    : nickname.length > 0
                      ? 'border-border-primary'
                      : 'border-border-subtle focus:border-border-primary',
              )}
            />
            <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center">
              <button
                type="button"
                onClick={handleCheck}
                disabled={!formatValid || check.state === 'checking'}
                className="bg-surface-button-secondary-default hover:bg-surface-button-secondary-hover active:bg-surface-button-secondary-pressed text-content-brand focus-visible:ring-effect-focus-ring-primary rounded-8 text-button-14 px-3 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-40"
              >
                {check.state === 'checking' ? '확인 중' : '중복확인'}
              </button>
            </div>
          </div>

          {helper !== undefined && (
            <p
              id={helperId}
              role={status === 'error' ? 'alert' : undefined}
              className={cn(
                'text-caption-12',
                status === 'success' ? 'text-content-success' : 'text-content-error',
              )}
            >
              {helper}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            className={`${DIALOG_BUTTON_CLASS} border-border-button-quarternary bg-background-default hover:bg-surface-button-quarternary-hover active:bg-surface-button-quarternary-pressed text-content-primary border`}
            disabled={isPending}
            onClick={requestClose}
            type="button"
          >
            취소
          </button>
          <button
            className={`${DIALOG_BUTTON_CLASS} bg-surface-button-primary-default hover:bg-surface-button-primary-hover active:bg-surface-button-primary-pressed text-content-oncolor`}
            disabled={!passed || isPending}
            onClick={handleSubmit}
            type="button"
          >
            {isPending ? '변경 중' : '변경'}
          </button>
        </div>
      </div>
    </dialog>
  );
}
