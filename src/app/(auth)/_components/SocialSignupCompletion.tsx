'use client';

import { useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';

import { AlertDialog } from '@/components/ui/AlertDialog';
import { AUTH_ERROR_MESSAGES, AUTH_SUCCESS_MESSAGES } from '@/constants/authMessages';
import { ApiError } from '@/lib/api';
import { checkNicknameAvailability, completeSocialSignup } from '@/lib/authApi';
import { signupNicknameSchema } from '@/schemas/auth';

import { ScreenColumn } from './ScreenColumn';
import { SignupCompleteScreen } from './SignupCompleteScreen';
import { StepField, type FieldStatus } from './StepField';
import { StepFooter } from './StepFooter';
import {
  EMPTY_AGREEMENTS,
  TermsAgreementStep,
  isAllAgreed,
  type TermsAgreements,
} from './TermsAgreementStep';

// 소셜 최초 로그인 완료 화면(#18). 백엔드가 약관 미동의 유저를 `/oauth/callback?status=incomplete`로
// 되돌리면 콜백이 이 화면(/oauth/complete)으로 보낸다. 이미 SID 세션은 발급돼 있고(쿠키), 여기서
// 약관 동의 + 닉네임을 받아 `POST /api/auth/social-signup/complete`로 가입을 확정한다.
//
// 회원가입 위저드(/signup)와 달리 모드·이메일·아이디·비밀번호는 소셜 제공자·백엔드가 이미 채웠으므로,
// 백엔드가 요구하는 최소 2스텝(약관 동의 → 닉네임)만 진행한다. 약관 동의 화면·문구·하단 버튼은
// 회원가입과 동일 컴포넌트(TermsAgreementStep·StepFooter)를 재사용한다.
//
// 스텝이 짧아 URL 쿼리 대신 로컬 상태로 관리한다(딥링크 가드가 필요한 긴 위저드가 아님).
// 가입 확정 후에는 축하 완료 화면(complete)을 거쳐 홈으로 들어간다(로컬 위저드와 공용 화면 공유).

type CompletionStep = 'terms' | 'nickname' | 'complete';

export function SocialSignupCompletion() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 가입 확정 후의 완료 화면은 URL 플래그(?done=1)로 표시한다. 이렇게 해야 완료 화면에서
  // 새로고침해도 약관·닉네임 스텝으로 되돌아가 이미 가입된 유저가 completeSocialSignup을
  // 재호출하는 일이 없다(/oauth/complete 페이지 자체엔 완료 여부 가드가 없다).
  const [step, setStep] = useState<CompletionStep>(
    searchParams.get('done') === '1' ? 'complete' : 'terms',
  );
  const [agreements, setAgreements] = useState<TermsAgreements>(EMPTY_AGREEMENTS);

  const { register, control, setValue, setFocus } = useForm<{ nickname: string }>({
    mode: 'onChange',
    defaultValues: { nickname: '' },
  });
  const nicknameValue = useWatch({ control, name: 'nickname', defaultValue: '' });

  // 닉네임은 형식이 아니라 중복확인(백엔드)으로 통과가 결정된다. 어떤 값에 대해 확인했는지 함께
  // 저장해, 확인 후 값을 고치면 통과를 무효화한다(회원가입 위저드와 동일 규칙).
  const [nicknameCheck, setNicknameCheck] = useState<{
    state: 'idle' | 'checking' | 'available' | 'taken';
    forValue: string;
  }>({ state: 'idle', forValue: '' });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogMessage, setDialogMessage] = useState<string | null>(null);
  // 세션 만료(401) 안내 다이얼로그를 닫으면 로그인 화면으로 보낸다(완료 화면에 갇히지 않게).
  const [returnToLoginAfterDialog, setReturnToLoginAfterDialog] = useState(false);

  const allAgreed = isAllAgreed(agreements);
  const nicknameFormatValid = signupNicknameSchema.safeParse(nicknameValue).success;
  const nicknameResolved = nicknameCheck.forValue === nicknameValue ? nicknameCheck.state : 'idle';
  const nicknamePassed = nicknameResolved === 'available';

  const handleCheckNickname = async () => {
    // 앞뒤 공백을 제거한 값으로 확인·저장한다(공백만/딸려온 공백 방지). 빈값이면 확인하지 않는다.
    const trimmed = nicknameValue.trim();
    if (
      trimmed.length === 0 ||
      nicknameCheck.state === 'checking' ||
      !signupNicknameSchema.safeParse(trimmed).success
    ) {
      return;
    }
    if (trimmed !== nicknameValue) {
      setValue('nickname', trimmed);
    }
    setNicknameCheck({ state: 'checking', forValue: trimmed });
    try {
      const available = await checkNicknameAvailability(trimmed);
      setNicknameCheck({ state: available ? 'available' : 'taken', forValue: trimmed });
    } catch (error) {
      // 네트워크·서버 오류. 통과 상태로 두면 안 되므로 idle로 되돌린다.
      setNicknameCheck({ state: 'idle', forValue: '' });
      // 세션 만료(401)면 완료 요청과 동일하게 로그인 화면으로 되돌린다(완료 화면에 갇히지 않게).
      if (error instanceof ApiError && error.status === 401) {
        setDialogMessage('세션이 만료되었어요. 다시 로그인해 주세요.');
        setReturnToLoginAfterDialog(true);
        return;
      }
      setDialogMessage('닉네임 확인 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.');
    }
  };

  const handleComplete = async () => {
    // 스텝 게이팅상 이 시점엔 충족돼 있어야 하지만, 방어적으로 다시 확인한다.
    if (!allAgreed || !nicknamePassed || isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    try {
      await completeSocialSignup({
        termsAgreed: agreements.tos,
        policyAgreed: agreements.privacy,
        ageVerified: agreements.age14,
        nickname: nicknameValue.trim(),
      });
      // 가입 완료 = 로그인 성립. 축하 완료 화면을 보여주고, 거기 CTA로 홈에 진입한다.
      // URL에 완료 플래그를 남겨 이 화면에서 새로고침해도 스텝이 처음으로 돌아가지 않게 한다.
      setIsSubmitting(false);
      router.replace('/oauth/complete?done=1');
      setStep('complete');
    } catch (error) {
      setIsSubmitting(false);
      // 세션 만료(401)면 다시 로그인부터. 그 외는 일반 안내 후 재시도하게 둔다.
      if (error instanceof ApiError && error.status === 401) {
        setDialogMessage('세션이 만료되었어요. 다시 로그인해 주세요.');
        setReturnToLoginAfterDialog(true);
        return;
      }
      setDialogMessage('가입 처리 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.');
    }
  };

  if (step === 'complete') {
    // 이 시점엔 이미 세션이 발급돼 있으므로(가입 확정 완료) 로그인 화면이 아니라 홈으로 들어간다.
    // 뒤로가기로 완료 화면에 재진입하지 않도록 replace로 이동한다.
    return <SignupCompleteScreen ctaLabel="뭉치 시작하기" ctaHref="/" replace />;
  }

  if (step === 'terms') {
    return (
      <TermsAgreementStep
        value={agreements}
        onChange={setAgreements}
        // 완료를 그만두면 로그인 화면으로 되돌린다(다른 계정으로 다시 시도할 수 있게).
        onPrev={() => router.push('/login')}
        onNext={() => setStep('nickname')}
      />
    );
  }

  // step === 'nickname'
  const status: FieldStatus =
    nicknameResolved === 'available'
      ? 'success'
      : nicknameResolved === 'taken'
        ? 'error'
        : 'default';
  const nicknameField = register('nickname');

  return (
    <>
      <ScreenColumn>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-heading-20">닉네임 설정</h1>
            <p className="text-content-quarternary text-body-14">
              사용할 닉네임을 입력한 뒤 중복확인을 해주세요.
            </p>
          </div>

          <StepField
            id="social-nickname"
            label="닉네임"
            autoComplete="nickname"
            placeholder="닉네임을 입력해주세요."
            status={status}
            helper={
              status === 'success'
                ? AUTH_SUCCESS_MESSAGES.confirmed
                : nicknameResolved === 'taken'
                  ? AUTH_ERROR_MESSAGES.nickname.taken
                  : undefined
            }
            value={nicknameValue}
            onEnter={() => {
              // 확인 통과면 완료, 아니면 빈값만 아니면 중복확인 실행.
              if (nicknamePassed) {
                handleComplete();
              } else if (nicknameFormatValid) {
                handleCheckNickname();
              }
            }}
            field={{
              ...nicknameField,
              onChange: (event) => {
                // 값을 고치면 직전 중복확인 결과를 무효화한다(다시 확인해야 완료 가능).
                setNicknameCheck({ state: 'idle', forValue: '' });
                return nicknameField.onChange(event);
              },
            }}
            onClear={() => {
              setValue('nickname', '');
              setNicknameCheck({ state: 'idle', forValue: '' });
              setFocus('nickname');
            }}
            rightSlot={
              <button
                type="button"
                onClick={handleCheckNickname}
                disabled={!nicknameFormatValid || nicknameCheck.state === 'checking'}
                className="bg-surface-button-tertiary-default hover:bg-surface-button-tertiary-hover active:bg-surface-button-tertiary-pressed text-content-inverse focus-visible:ring-effect-focus-ring-primary rounded-8 text-button-14 px-3 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-40"
              >
                {nicknameCheck.state === 'checking' ? '확인 중' : '중복확인'}
              </button>
            }
          />
        </div>

        <StepFooter
          onPrev={() => setStep('terms')}
          nextLabel={isSubmitting ? '처리 중' : '완료'}
          onNext={handleComplete}
          canProceed={nicknamePassed && !isSubmitting}
        />
      </ScreenColumn>

      <AlertDialog
        isOpen={dialogMessage !== null}
        message={dialogMessage ?? ''}
        onClose={() => {
          setDialogMessage(null);
          if (returnToLoginAfterDialog) {
            router.push('/login');
          }
        }}
      />
    </>
  );
}
