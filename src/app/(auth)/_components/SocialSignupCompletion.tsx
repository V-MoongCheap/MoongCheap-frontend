'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';

import { AlertDialog } from '@/components/ui/AlertDialog';
import { AUTH_ERROR_MESSAGES, AUTH_SUCCESS_MESSAGES } from '@/constants/authMessages';
import { ApiError } from '@/lib/api';
import { checkNicknameAvailability, completeSocialSignup, getMe } from '@/lib/authApi';
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
// 완료 화면(complete)은 이 세션에서 방금 가입을 확정한 순간에만 띄우는 일시 상태다. URL로
// 표현하지 않으므로 새로고침·재방문으로는 다시 뜨지 않는다(완료 화면 재노출은 UX 오류).
//
// 진입 가드: 이 화면은 "약관 미동의(=미완료) 소셜 유저"만 밟아야 한다. 그래서 마운트 시 getMe로
// 서버가 판정한 완료 여부를 확인한다 — 이미 완료된 유저(새로고침·재방문·딥링크)는 홈으로 보내고,
// 미완료(또는 미로그인)만 약관 스텝을 시작한다. URL 값이 아니라 서버 상태로 판정하므로 완료 화면을
// 위조로 띄울 수 없다(CodeRabbit 지적 대응). 완료 직후 경로는 handleComplete가 setStep으로 직접
// 넘겨 이 getMe를 타지 않는다(방금 서버가 확정했으니 재확인 불필요).
// ⚠️ 전제: IncompleteSignupFilter가 미완료 유저의 GET /api/members/me도 막아 getMe가 null을 준다.
//    (백엔드 실측 확인 필요 — 미완료에도 프로필을 준다면 완료 판정 신호를 보강해야 한다.)

type CompletionStep = 'verifying' | 'terms' | 'nickname' | 'complete';

export function SocialSignupCompletion() {
  const router = useRouter();

  // 서버 완료 여부를 확인하기 전까진 어떤 스텝도 확정하지 않는다(가짜 완료 화면·잘못된 약관 노출 방지).
  const [step, setStep] = useState<CompletionStep>('verifying');
  const [agreements, setAgreements] = useState<TermsAgreements>(EMPTY_AGREEMENTS);

  // 마운트 1회: 서버가 판정한 가입 완료 여부로 이 화면 노출을 가드한다(위 주석 참고).
  useEffect(() => {
    let active = true;
    getMe()
      .then((user) => {
        if (!active) {
          return;
        }
        // 이미 완료된 유저는 이 화면에 있을 이유가 없다 → 홈으로(뒤로가기 방지 replace).
        // 미완료(또는 미로그인) 소셜 유저만 약관 동의부터 시작한다.
        if (user !== null) {
          router.replace('/');
        } else {
          setStep('terms');
        }
      })
      .catch(() => {
        // getMe가 던지는 경우(미완료를 401 외 상태로 막거나 네트워크 오류). 완료로 볼 수 없으므로
        // 안전하게 약관 스텝으로 진입시킨다(완료 확정은 completeSocialSignup 성공으로만 이뤄진다).
        if (active) {
          setStep('terms');
        }
      });
    return () => {
      active = false;
    };
  }, [router]);

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
      // 가입 완료 = 로그인 성립. 축하 완료 화면을 잠깐 보여주고, 거기 CTA로 홈에 진입한다.
      // 완료 화면은 이 세션 상태로만 띄운다(새로고침 시엔 위 getMe 가드가 홈으로 보낸다).
      setIsSubmitting(false);
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

  if (step === 'verifying') {
    // 서버 완료 여부 확인 중(찰나). 잘못된 화면이 깜빡이지 않도록 아무것도 그리지 않는다.
    return null;
  }

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
