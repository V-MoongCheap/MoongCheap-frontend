'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useForm, useWatch, type SubmitErrorHandler } from 'react-hook-form';

import { AlertDialog } from '@/components/ui/AlertDialog';
import { AUTH_ERROR_MESSAGES } from '@/constants/authMessages';
import { ApiError } from '@/lib/api';
import { login } from '@/lib/authApi';
import { cn } from '@/lib/cn';
import { loginSchema, type LoginValues } from '@/schemas/auth';

// 공통 UI 프리미티브(src/components/ui) 규약이 확정되기 전이라 입력칸은 네이티브 요소로 작성한다.
// 규약이 정해지면 Input 프리미티브로 치환하며, 아래 폼 로직은 그대로 둔다.
//
// 에러 표현은 Figma 로그인 시안(0-1. 로그인 - error)을 따른다.
//  - 입력값이 있으면 오른쪽에 지우기(X) 버튼을 띄운다.
//  - 검증/로그인 실패 시 해당 입력칸을 빨간 테두리·라벨·아이콘으로 바꾸고,
//    안내 문구는 인라인 텍스트가 아니라 모달(AlertDialog)로 띄운다(시안에 인라인 문구 없음).
//    화면에는 문구를 숨기지만 스크린리더에는 role="alert"로 전달한다.

// 라벨은 상태와 무관하게 항상 기본 회색. 에러 시에도 빨갛게 하지 않는다(Figma 시안 기준).
const FLOATING_LABEL_CLASS =
  'text-content-quarternary bg-background-default absolute -top-2 left-3 px-1 text-xs font-medium';

interface ClearButtonProps {
  hasError: boolean;
  label: string;
  onClear: () => void;
}

function ClearButton({ hasError, label, onClear }: ClearButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      tabIndex={-1}
      onClick={onClear}
      className={cn(
        'absolute top-1/2 right-3 -translate-y-1/2',
        hasError ? 'text-content-error' : 'text-content-quarternary',
      )}
    >
      <svg viewBox="0 0 20 20" aria-hidden="true" className="size-5" fill="currentColor">
        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm3.54 10.48l-1.06 1.06L10 11.06l-2.48 2.48-1.06-1.06L8.94 10 6.46 7.52l1.06-1.06L10 8.94l2.48-2.48 1.06 1.06L11.06 10l2.48 2.48z" />
      </svg>
    </button>
  );
}

export function LoginForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  // 검증·로그인 실패 안내는 모달로 띄운다. 메시지가 있으면 열린 상태.
  const [dialogMessage, setDialogMessage] = useState<string | null>(null);
  // 로그인 실패(자격증명 불일치)는 어느 쪽이 틀렸는지 특정하지 않으므로 두 필드를 함께 빨갛게 한다.
  // 시안(0-1. 로그인 - error)의 표현. 사용자가 값을 고치면 해제한다.
  const [hasCredentialsError, setHasCredentialsError] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { id: '', password: '' },
  });

  // useWatch는 watch()와 달리 메모이제이션 안전(React Compiler 호환)이라 이걸 쓴다.
  const idValue = useWatch({ control, name: 'id' });
  const passwordValue = useWatch({ control, name: 'password' });

  // 값을 수정하면 직전 로그인 실패 표시(빨간 테두리)를 해제한다. effect가 아니라 입력 onChange에서 처리한다.
  const clearCredentialsError = () => setHasCredentialsError(false);
  const idField = register('id');
  const passwordField = register('password');

  const onValid = async (values: LoginValues) => {
    try {
      await login(values.id, values.password);
    } catch (error) {
      if (!(error instanceof ApiError)) {
        throw error;
      }
      // 로그인 실패는 어느 쪽이 틀렸는지 알려주지 않는다. 계정 존재 여부가 드러나기 때문이다.
      // 아이디 형식 위반(400)도 같은 문구로 접는다. 폼은 형식을 검사하지 않고(필수만) 백엔드가
      // 계정 조회 전에 형식부터 거르므로, 사용자에게는 틀린 아이디와 다르지 않다.
      if (error.status === 401 || error.status === 400) {
        setHasCredentialsError(true);
        setDialogMessage(AUTH_ERROR_MESSAGES.login.credentials);
        return;
      }
      // 잠김(423)·네트워크·서버 오류는 입력값 문제가 아니라 칸을 빨갛게 하지 않고 백엔드 문구를 띄운다.
      setDialogMessage(error.message);
      return;
    }

    // 🔒 로그인 전(비회원)에 받은 조회 캐시를 버린다. 수요보드 참여 여부(`isParticipating`)처럼
    // 회원마다 다른 값이 비회원 기준으로 남아 있으면 로그인 직후 화면에 잘못 그려진다. 세션 캐시도
    // 함께 지워지므로 홈이 getMe로 새 세션을 다시 받는다.
    queryClient.clear();
    // 홈으로 이동한다. replace로 히스토리를 남기지 않아 뒤로가기가 로그인으로 돌아오지 않는다.
    router.replace('/');
  };

  const onInvalid: SubmitErrorHandler<LoginValues> = (formErrors) => {
    // 클라이언트 검증 실패: 빈 값 등. 첫 오류 메시지를 모달로 안내한다(빨간 스타일은 필드에서 처리).
    const firstMessage = formErrors.id?.message ?? formErrors.password?.message;
    if (firstMessage !== undefined) {
      setDialogMessage(firstMessage);
    }
  };

  const onSubmit = handleSubmit(onValid, onInvalid);

  // 검증 상태(a11y용): 값이 비어 형식이 틀리든(errors) 자격증명 실패든 "유효하지 않음"을 뜻한다.
  // 화면 색과 별개로 aria-invalid는 이 값을 따른다(빈 필수 필드도 스크린리더엔 invalid로 전달).
  const isIdInvalid = errors.id !== undefined || hasCredentialsError;
  const isPasswordInvalid = errors.password !== undefined || hasCredentialsError;

  // 빨간 스타일(시각)은 "값이 있는데 잘못된" 경우에만 준다. 빈 필드는 어떤 경우에도 빨갛지 않게 해
  // 초기 상태(플레이스홀더)로 돌아가게 한다(Figma 에러 프레임도 값이 채워진 상태만 빨감).
  // errors.id 항은 현재 스키마상 값이 있을 땐 발생하지 않지만(필수 검증뿐), 향후 아이디 형식
  // 규칙이 추가되면 "값 있고 형식 오류"를 빨갛게 만들기 위해 남겨 둔다.
  const hasIdError = idValue.length > 0 && isIdInvalid;
  const hasPasswordError = passwordValue.length > 0 && isPasswordInvalid;

  return (
    <>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <div>
          <div className="relative">
            <label htmlFor="login-id" className={FLOATING_LABEL_CLASS}>
              아이디
            </label>
            <input
              id="login-id"
              type="text"
              autoComplete="username"
              placeholder="아이디를 입력해주세요."
              aria-invalid={isIdInvalid}
              aria-describedby={errors.id !== undefined ? 'login-id-error' : undefined}
              className={cn(
                'placeholder:text-content-quinary rounded-8 h-14 w-full border px-4 pr-11 text-sm outline-none',
                // 빈 값: 회색(포커스 시 검정) / 값 있음: 검정 / 에러: 빨강
                hasIdError
                  ? 'border-border-error'
                  : idValue.length > 0
                    ? 'border-border-primary'
                    : 'border-border-subtle focus:border-border-primary',
              )}
              {...idField}
              onChange={(event) => {
                clearCredentialsError();
                return idField.onChange(event);
              }}
            />
            {idValue.length > 0 && (
              <ClearButton
                hasError={hasIdError}
                label="아이디 지우기"
                onClear={() => {
                  setValue('id', '');
                  clearCredentialsError();
                  setFocus('id');
                }}
              />
            )}
          </div>
          {errors.id !== undefined && (
            <p id="login-id-error" role="alert" className="sr-only">
              {errors.id.message}
            </p>
          )}
        </div>

        <div>
          <div className="relative">
            <label htmlFor="login-password" className={FLOATING_LABEL_CLASS}>
              비밀번호
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="비밀번호를 입력해주세요."
              aria-invalid={isPasswordInvalid}
              aria-describedby={errors.password !== undefined ? 'login-password-error' : undefined}
              className={cn(
                'placeholder:text-content-quinary rounded-8 h-14 w-full border px-4 pr-11 text-sm outline-none',
                // 빈 값: 회색(포커스 시 검정) / 값 있음: 검정 / 에러: 빨강
                hasPasswordError
                  ? 'border-border-error'
                  : passwordValue.length > 0
                    ? 'border-border-primary'
                    : 'border-border-subtle focus:border-border-primary',
              )}
              {...passwordField}
              onChange={(event) => {
                clearCredentialsError();
                return passwordField.onChange(event);
              }}
            />
            {passwordValue.length > 0 && (
              <ClearButton
                hasError={hasPasswordError}
                label="비밀번호 지우기"
                onClear={() => {
                  setValue('password', '');
                  clearCredentialsError();
                  setFocus('password');
                }}
              />
            )}
          </div>
          {errors.password !== undefined && (
            <p id="login-password-error" role="alert" className="sr-only">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* 로그인 CTA는 검정(tertiary) — Figma 08.27 확정(회원가입 CTA와 통일).
            글씨는 content-inverse(라이트=흰색/다크=검정)로 다크모드 대비 유지. */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-surface-button-tertiary-default hover:bg-surface-button-tertiary-hover active:bg-surface-button-tertiary-pressed text-content-inverse rounded-8 text-button-15 mt-2 h-13 disabled:opacity-50"
        >
          {isSubmitting ? '로그인 중' : '로그인'}
        </button>
      </form>

      <AlertDialog
        isOpen={dialogMessage !== null}
        message={dialogMessage ?? ''}
        onClose={() => setDialogMessage(null)}
      />
    </>
  );
}
