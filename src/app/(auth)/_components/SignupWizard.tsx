'use client';

import { useEffect, useRef, useState } from 'react';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';

import { AlertDialog } from '@/components/ui/AlertDialog';
import { AUTH_ERROR_MESSAGES, AUTH_SUCCESS_MESSAGES } from '@/constants/authMessages';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { cn } from '@/lib/cn';
import { mockCheckIdDuplicate, mockCheckNicknameDuplicate, mockSignup } from '@/mocks/auth';
import {
  signupEmailSchema,
  signupIdSchema,
  signupNicknameSchema,
  signupPasswordSchema,
  type SignupMode,
  type SignupStep,
} from '@/schemas/auth';

import { ModeSelectStep } from './ModeSelectStep';
import { PhoneVerificationStep } from './PhoneVerificationStep';
import { ScreenColumn } from './ScreenColumn';
import { SignupCompleteScreen } from './SignupCompleteScreen';
import { StepField, type FieldStatus } from './StepField';
import {
  EMPTY_AGREEMENTS,
  TermsAgreementStep,
  isAllAgreed,
  type TermsAgreements,
} from './TermsAgreementStep';

// 회원가입 위저드. Figma 08.27 "A. 로그인 및 회원가입" 재설계 시안대로 모드선택→개인정보동의→
// 이메일→아이디→닉네임→비밀번호→가입완료를 한 라우트(/signup)에서 진행한다.
// (닉네임은 Figma 미반영 잠정 스텝. 아이디와 동일하게 중복확인으로 통과가 결정된다.)
// (휴대폰 인증은 SMS 백엔드 규격 미확정이라 UI+목업으로 구현 — PhoneVerificationStep 참고.)
// 스텝은 URL 쿼리(?step=)로 표현해 브라우저 뒤로가기가 이전 스텝으로 가게 하고, 쿼리만 바뀌는
// 소프트 내비라 이 컴포넌트는 마운트를 유지해 입력값·선택값이 스텝 간 보존된다.
// useSearchParams는 클라이언트 훅이라 page.tsx에서 <Suspense>로 감싼다.
// 모드선택·개인정보동의·휴대폰인증 화면은 입력칸 화면과 UI가 달라 각자 컴포넌트로 분리하고
// 여기서 상태·내비게이션만 넘긴다.
//
// 입력 상호작용(포커스 시 키보드 오버레이, 유효 시 CTA 활성)은 모바일 네이티브 키보드 동작이라
// 웹에선 OS가 처리한다. 하단 버튼은 키보드가 올라오면 그 높이만큼 위로 고정한다(useKeyboardHeight
// = visualViewport 기반 → footerRef transform, 아래 참고).
//
// 팔레트는 시맨틱 토큰(#15) 머지에 맞춰 교체 완료. 버튼 변형은 MoongCheap_DS Button 컴포넌트
//   기준이다: 검정 CTA(다음·중복확인·로그인하러가기)=tertiary, 이전(아웃라인)=quarternary,
//   비활성=disabled-primary. 코랄(primary)은 브랜드 CTA용이라 이 화면엔 쓰지 않는다.
//   로그인 화면 CTA도 검정(tertiary)으로 확정(Figma 08.27) — 두 화면 CTA 색 통일.

function isSignupStep(value: string | null): value is SignupStep {
  return (
    value === 'mode' ||
    value === 'terms' ||
    value === 'phone' ||
    value === 'email' ||
    value === 'id' ||
    value === 'nickname' ||
    value === 'password' ||
    value === 'complete'
  );
}

// 값이 있으면서 유효하면(포커스 여부와 무관하게) 즉시 success.
// 무효일 때 error는 "한 번 벗어난(touched) 뒤 && 지금 포커스가 없을 때"만 준다.
// 포커스 중(타이핑 중)엔 빨강을 숨겨, 수정하는 내내 에러가 깜빡이지 않게 한다.
// 인자는 같은 타입 불리언이 여러 개라 순서 뒤바뀜을 막으려 객체로 받는다.
function deriveStatus(args: {
  value: string;
  isValid: boolean;
  isTouched: boolean;
  isFocused: boolean;
}): FieldStatus {
  const { value, isValid, isTouched, isFocused } = args;
  if (value.length === 0) {
    return 'default';
  }
  if (isValid) {
    return 'success';
  }
  return isTouched && !isFocused ? 'error' : 'default';
}

export function SignupWizard() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const stepParam = searchParams.get('step');
  const step: SignupStep = isSignupStep(stepParam) ? stepParam : 'mode';

  const {
    register,
    control,
    setValue,
    setFocus,
    formState: { touchedFields },
  } = useForm<{ email: string; id: string; nickname: string; password: string }>({
    mode: 'onChange',
    defaultValues: { email: '', id: '', nickname: '', password: '' },
  });

  // useWatch는 watch()와 달리 메모이제이션 안전(React Compiler 호환)이라 이걸 쓴다.
  // defaultValue를 줘 첫 렌더부터 문자열을 반환하게 한다(없으면 undefined→'' 전환으로 입력칸이
  // uncontrolled→controlled로 바뀌었다는 React 경고가 난다).
  const emailValue = useWatch({ control, name: 'email', defaultValue: '' });
  const idValue = useWatch({ control, name: 'id', defaultValue: '' });
  const nicknameValue = useWatch({ control, name: 'nickname', defaultValue: '' });
  const passwordValue = useWatch({ control, name: 'password', defaultValue: '' });

  // 온보딩 앞단(모드 선택·개인정보 동의·휴대폰 인증) 상태. mode=null은 미선택(기본). 스텝 간 보존한다.
  const [mode, setMode] = useState<SignupMode | null>(null);
  const [agreements, setAgreements] = useState<TermsAgreements>(EMPTY_AGREEMENTS);
  const [phone, setPhone] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);

  // 아이디는 형식이 아니라 중복확인(서버/mock)으로 통과가 결정된다. 어떤 값에 대해 확인했는지
  // 함께 저장해, 확인 후 값을 고치면 통과를 무효화한다.
  const [idCheck, setIdCheck] = useState<{
    state: 'idle' | 'checking' | 'available' | 'taken';
    forValue: string;
  }>({
    state: 'idle',
    forValue: '',
  });
  // 닉네임도 아이디와 동일하게 중복확인 결과로 통과가 결정된다(확인한 값과 함께 저장해, 확인 후
  // 값을 고치면 통과를 무효화한다).
  const [nicknameCheck, setNicknameCheck] = useState<{
    state: 'idle' | 'checking' | 'available' | 'taken';
    forValue: string;
  }>({
    state: 'idle',
    forValue: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [dialogMessage, setDialogMessage] = useState<string | null>(null);
  // 한 번에 한 필드만 보이므로 단일 불리언으로 현재 입력칸의 포커스 여부를 추적한다.
  // deriveStatus가 포커스 중엔 에러를 숨기는 데 쓴다.
  const [isFieldFocused, setIsFieldFocused] = useState(false);

  // 키보드가 올라오면 하단 CTA를 그 높이만큼 위로 끌어올린다(Figma 7-2).
  // 컨테이너 높이를 줄이면 AuthLayout의 justify-center가 되살아나 레이아웃이 흔들리므로,
  // 높이는 그대로 두고 버튼 행만 transform으로 이동시킨다. 값이 뷰포트 측정 기반이라
  // Tailwind 클래스로 표현할 수 없어, 하드코딩 스타일이 아닌 런타임 값으로 ref에 직접 적용한다.
  const keyboardHeight = useKeyboardHeight();
  const footerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const footer = footerRef.current;
    if (footer === null) {
      return;
    }
    footer.style.transform = keyboardHeight > 0 ? `translateY(-${keyboardHeight}px)` : '';
  }, [keyboardHeight]);

  const emailValid = signupEmailSchema.safeParse(emailValue).success;
  const passwordValid = signupPasswordSchema.safeParse(passwordValue).success;
  // 아이디 형식(영문·숫자만) 검증. 형식이 틀리면(특수문자·공백 등) 중복확인 자체를 막는다.
  const idFormatValid = signupIdSchema.safeParse(idValue).success;
  const idHasInvalidChars = idValue.trim().length > 0 && !idFormatValid;
  const idResolved = idCheck.forValue === idValue ? idCheck.state : 'idle';
  const idPassed = idResolved === 'available';
  // 닉네임은 형식 규칙 없이 "빈값 아님"이면 중복확인 가능. 통과는 아이디와 같은 규칙으로 판정한다.
  const nicknameFormatValid = signupNicknameSchema.safeParse(nicknameValue).success;
  const nicknameResolved = nicknameCheck.forValue === nicknameValue ? nicknameCheck.state : 'idle';
  const nicknamePassed = nicknameResolved === 'available';
  const modeSelected = mode !== null;
  const allAgreed = isAllAgreed(agreements);
  // 온보딩 앞단(모드·동의·휴대폰) 중 아직 못 채운 가장 앞 스텝. 없으면(전부 완료) null.
  // 뒤 스텝(email~password)에서도 이걸 재확인해, 나중에 phone으로 돌아가 번호를 고쳐 인증이
  // 풀린 채로 ?step=password 딥링크로 건너뛰어 제출되는 경로를 막는다.
  const onboardingTarget: SignupStep | null = !modeSelected
    ? 'mode'
    : !allAgreed
      ? 'terms'
      : !phoneVerified
        ? 'phone'
        : null;

  // 스텝을 건너뛴 진입(딥링크·새로고침) 가드. 선행 조건이 없으면 가능한 앞 스텝으로 되돌린다.
  useEffect(() => {
    if (step === 'terms' && !modeSelected) {
      router.replace(`${pathname}?step=mode`);
    } else if (step === 'phone' && onboardingTarget !== null && onboardingTarget !== 'phone') {
      // phone 스텝 자체는 phoneVerified 미충족이 정상이므로, 그 앞 단계(mode·terms)만 되돌린다.
      router.replace(`${pathname}?step=${onboardingTarget}`);
    } else if (step === 'email' && onboardingTarget !== null) {
      router.replace(`${pathname}?step=${onboardingTarget}`);
    } else if (step === 'id' && (onboardingTarget !== null || !emailValid)) {
      router.replace(`${pathname}?step=${onboardingTarget ?? 'email'}`);
    } else if (step === 'nickname' && (onboardingTarget !== null || !emailValid || !idPassed)) {
      router.replace(`${pathname}?step=${onboardingTarget ?? (!emailValid ? 'email' : 'id')}`);
    } else if (
      step === 'password' &&
      (onboardingTarget !== null || !emailValid || !idPassed || !nicknamePassed)
    ) {
      router.replace(
        `${pathname}?step=${onboardingTarget ?? (!emailValid ? 'email' : !idPassed ? 'id' : 'nickname')}`,
      );
    } else if (step === 'complete' && !submitted) {
      router.replace(`${pathname}?step=mode`);
    }
  }, [
    step,
    modeSelected,
    onboardingTarget,
    emailValid,
    idPassed,
    nicknamePassed,
    submitted,
    pathname,
    router,
  ]);

  const goTo = (next: SignupStep) => {
    router.push(`${pathname}?step=${next}`);
  };

  const goPrev = () => {
    // 이후 스텝은 push로 쌓인 히스토리를 back()으로 팝해 브라우저 뒤로가기와 맞춘다.
    // 다만 첫 스텝(모드 선택)에서 back()은 위저드가 브라우저 첫 진입(딥링크·새 탭)일 때 사이트 밖으로
    // 나가버리므로, 앱 내 진입점인 홈으로 명시 이동한다.
    if (step === 'mode') {
      router.push('/');
    } else {
      router.back();
    }
  };

  const handleCheckId = async () => {
    // 아이디는 앞뒤 공백을 제거한 값으로 확인·저장한다(공백만/공백 딸린 입력 방지).
    // 스텝 게이팅은 스키마가 아니라 이 중복확인 결과로 결정되므로 여기서 직접 정리한다.
    // 입력칸에도 정리된 값을 반영해, 이후 제출(mockSignup)과 idResolved 매칭이 정리된 값으로 맞는다.
    const trimmedId = idValue.trim();
    // 형식 위반(특수문자·공백 등)이면 확인하지 않는다(버튼도 비활성이지만 방어적으로 한 번 더).
    if (
      trimmedId.length === 0 ||
      idCheck.state === 'checking' ||
      !signupIdSchema.safeParse(trimmedId).success
    ) {
      return;
    }
    if (trimmedId !== idValue) {
      setValue('id', trimmedId);
    }
    setIdCheck({ state: 'checking', forValue: trimmedId });
    const result = await mockCheckIdDuplicate(trimmedId);
    setIdCheck({ state: result.ok ? 'available' : 'taken', forValue: trimmedId });
  };

  const handleCheckNickname = async () => {
    // 아이디와 동일하게 앞뒤 공백을 제거한 값으로 확인·저장한다. 형식 규칙이 없어 "빈값 아님"만 막는다.
    const trimmedNickname = nicknameValue.trim();
    if (
      trimmedNickname.length === 0 ||
      nicknameCheck.state === 'checking' ||
      !signupNicknameSchema.safeParse(trimmedNickname).success
    ) {
      return;
    }
    if (trimmedNickname !== nicknameValue) {
      setValue('nickname', trimmedNickname);
    }
    setNicknameCheck({ state: 'checking', forValue: trimmedNickname });
    const result = await mockCheckNicknameDuplicate(trimmedNickname);
    setNicknameCheck({ state: result.ok ? 'available' : 'taken', forValue: trimmedNickname });
  };

  const handleSubmitPassword = async () => {
    // mode·동의·휴대폰 인증·이메일·아이디·닉네임은 스텝 가드상 이 단계에선 충족돼 있어야 하지만,
    // 뒤로 돌아가 값을 고쳐(예: 번호 재입력으로 인증 해제, 아이디 수정으로 중복확인 무효화) 선행
    // 조건이 풀린 상태로 스텝 가드 리다이렉트 전에 제출되는 경로를 막기 위해 방어적으로 다시 확인한다.
    if (
      !passwordValid ||
      isSubmitting ||
      mode === null ||
      !allAgreed ||
      !phoneVerified ||
      !emailValid ||
      !idPassed ||
      !nicknamePassed
    ) {
      return;
    }
    setIsSubmitting(true);
    // 온보딩에서 고른 mode·인증한 phone도 함께 넘긴다(백엔드 규격 확정 시 payload 그대로 매핑).
    const result = await mockSignup({
      email: emailValue,
      id: idValue,
      nickname: nicknameValue,
      password: passwordValue,
      mode,
      phone,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      // happy-path mock이라 실제로는 도달하지 않지만, 서버 연동 시 실패 응답을 대비해 안내한다.
      setDialogMessage(result.message);
      return;
    }
    setSubmitted(true);
    goTo('complete');
  };

  if (step === 'complete') {
    // 로컬 가입은 자동로그인을 하지 않으므로 완료 후 로그인 화면으로 보낸다([[security-baseline]] 회피).
    return <SignupCompleteScreen ctaLabel="로그인하러가기" ctaHref="/login" />;
  }

  // 모드 선택·개인정보 동의는 입력칸 화면과 UI가 달라 전용 컴포넌트로 그린다.
  // 상태는 위저드가 보관하고, 다음/이전 내비게이션만 넘긴다.
  if (step === 'mode') {
    return (
      <ModeSelectStep
        value={mode}
        onChange={setMode}
        onPrev={goPrev}
        onNext={() => goTo('terms')}
      />
    );
  }

  if (step === 'terms') {
    return (
      <TermsAgreementStep
        value={agreements}
        onChange={setAgreements}
        onPrev={goPrev}
        onNext={() => goTo('phone')}
      />
    );
  }

  if (step === 'phone') {
    return (
      <PhoneVerificationStep
        phone={phone}
        onPhoneChange={setPhone}
        verified={phoneVerified}
        onVerifiedChange={setPhoneVerified}
        onPrev={goPrev}
        onNext={() => goTo('email')}
      />
    );
  }

  // 스텝별 화면 구성. 상태·헬퍼 문구는 여기서 결정하고 표현은 StepField가 맡는다.
  const stepView = (() => {
    if (step === 'id') {
      // 형식 오류는 이메일·비번과 같은 규칙으로 blur 후(포커스 없을 때)에만 노출한다(타이핑 중 깜빡임 방지).
      const idFormatError = idHasInvalidChars && touchedFields.id === true && !isFieldFocused;
      // 상태 우선순위: 중복확인 통과(success) > 중복/형식 오류(error) > 기본.
      const status: FieldStatus =
        idResolved === 'available'
          ? 'success'
          : idResolved === 'taken' || idFormatError
            ? 'error'
            : 'default';
      const idField = register('id');
      return {
        subtitle: '아이디를 입력한 뒤 중복확인을 해주세요.',
        field: (
          <StepField
            id="signup-id"
            label="아이디"
            autoComplete="username"
            placeholder="아이디를 입력해주세요."
            status={status}
            helper={
              status === 'success'
                ? AUTH_SUCCESS_MESSAGES.confirmed
                : idResolved === 'taken'
                  ? AUTH_ERROR_MESSAGES.id.taken
                  : idFormatError
                    ? AUTH_ERROR_MESSAGES.id.format
                    : undefined
            }
            value={idValue}
            onFocusChange={setIsFieldFocused}
            onEnter={() => {
              // 확인 통과면 다음 스텝(닉네임), 아니면 형식이 맞을 때만 중복확인 실행.
              if (idPassed) {
                goTo('nickname');
              } else if (idFormatValid) {
                handleCheckId();
              }
            }}
            field={{
              ...idField,
              onChange: (event) => {
                // 값을 고치면 직전 중복확인 결과를 무효화한다(다시 확인해야 다음으로).
                setIdCheck({ state: 'idle', forValue: '' });
                return idField.onChange(event);
              },
            }}
            onClear={() => {
              setValue('id', '');
              setIdCheck({ state: 'idle', forValue: '' });
              setFocus('id');
            }}
            rightSlot={
              <button
                type="button"
                onClick={handleCheckId}
                disabled={!idFormatValid || idCheck.state === 'checking'}
                className="bg-surface-button-tertiary-default hover:bg-surface-button-tertiary-hover active:bg-surface-button-tertiary-pressed text-content-inverse focus-visible:ring-effect-focus-ring-primary rounded-8 text-button-14 px-3 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-40"
              >
                {idCheck.state === 'checking' ? '확인 중' : '중복확인'}
              </button>
            }
          />
        ),
        canProceed: idPassed,
        onNext: () => goTo('nickname'),
      };
    }

    if (step === 'nickname') {
      // 아이디 스텝과 동일한 상태 우선순위: 중복확인 통과(success) > 중복(error) > 기본.
      // 닉네임은 형식 규칙이 없어 format 오류 분기는 두지 않는다.
      const status: FieldStatus =
        nicknameResolved === 'available'
          ? 'success'
          : nicknameResolved === 'taken'
            ? 'error'
            : 'default';
      const nicknameField = register('nickname');
      return {
        subtitle: '사용할 닉네임을 입력한 뒤 중복확인을 해주세요.',
        field: (
          <StepField
            id="signup-nickname"
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
            onFocusChange={setIsFieldFocused}
            onEnter={() => {
              // 확인 통과면 다음 스텝(비밀번호), 아니면 빈값만 아니면 중복확인 실행.
              if (nicknamePassed) {
                goTo('password');
              } else if (nicknameFormatValid) {
                handleCheckNickname();
              }
            }}
            field={{
              ...nicknameField,
              onChange: (event) => {
                // 값을 고치면 직전 중복확인 결과를 무효화한다(다시 확인해야 다음으로).
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
        ),
        canProceed: nicknamePassed,
        onNext: () => goTo('password'),
      };
    }

    if (step === 'password') {
      const status = deriveStatus({
        value: passwordValue,
        isValid: passwordValid,
        isTouched: touchedFields.password === true,
        isFocused: isFieldFocused,
      });
      return {
        subtitle: '비밀번호를 설정해주세요.',
        field: (
          <StepField
            id="signup-password"
            label="비밀번호"
            type="password"
            autoComplete="new-password"
            placeholder="비밀번호를 입력해주세요."
            status={status}
            helper={
              status === 'success'
                ? AUTH_SUCCESS_MESSAGES.confirmed
                : AUTH_ERROR_MESSAGES.password.rule
            }
            value={passwordValue}
            onFocusChange={setIsFieldFocused}
            onEnter={() => {
              if (passwordValid && !isSubmitting) {
                handleSubmitPassword();
              }
            }}
            field={register('password')}
            onClear={() => {
              setValue('password', '');
              setFocus('password');
            }}
          />
        ),
        canProceed: passwordValid && !isSubmitting,
        onNext: handleSubmitPassword,
      };
    }

    // step === 'email'
    const status = deriveStatus({
      value: emailValue,
      isValid: emailValid,
      isTouched: touchedFields.email === true,
      isFocused: isFieldFocused,
    });
    return {
      subtitle: '이메일을 입력해주세요.',
      field: (
        <StepField
          id="signup-email"
          label="이메일"
          type="email"
          autoComplete="email"
          placeholder="moongcheap@gmail.com"
          status={status}
          helper={
            status === 'success'
              ? AUTH_SUCCESS_MESSAGES.confirmed
              : status === 'error'
                ? AUTH_ERROR_MESSAGES.email.invalid
                : undefined
          }
          value={emailValue}
          onFocusChange={setIsFieldFocused}
          onEnter={() => {
            if (emailValid) {
              goTo('id');
            }
          }}
          field={register('email')}
          onClear={() => {
            setValue('email', '');
            setFocus('email');
          }}
        />
      ),
      canProceed: emailValid,
      onNext: () => goTo('id'),
    };
  })();

  return (
    <>
      {/* Figma 7-1(이메일-empty) 시안: 제목·입력칸은 상단, 이전/다음 버튼은 화면 하단 고정.
          ScreenColumn이 main(flex-1)을 채우고, 버튼 행을 mt-auto로 바닥에 붙인다. */}
      <ScreenColumn>
        {/* 폼으로 감싸 입력칸에서 Enter를 치면 '다음'으로 진행되게 한다(로그인 화면과 동일한 동작).
            '다음'은 type="submit"이고, 비활성(canProceed=false)일 땐 브라우저가 암묵 제출을 하지 않아
            유효할 때만 넘어간다. '이전'·'중복확인'은 type="button"이라 Enter 제출과 무관하다. */}
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (stepView.canProceed) {
              stepView.onNext();
            }
          }}
          className="flex flex-1 flex-col"
        >
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-heading-20">계정 정보 입력</h1>
              <p className="text-content-quarternary text-body-14">{stepView.subtitle}</p>
            </div>

            {stepView.field}
          </div>

          <div
            ref={footerRef}
            className="mt-auto flex gap-3 pt-8 transition-transform duration-200 ease-out"
          >
            <button
              type="button"
              onClick={goPrev}
              className="border-border-button-quarternary bg-surface-button-quarternary-default hover:bg-surface-button-quarternary-hover active:bg-surface-button-quarternary-pressed text-content-primary focus-visible:ring-effect-focus-ring-primary rounded-8 text-button-15 h-13 flex-1 border outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              이전
            </button>
            <button
              type="submit"
              disabled={!stepView.canProceed}
              className={cn(
                'focus-visible:ring-effect-focus-ring-primary rounded-8 text-button-15 h-13 flex-1 outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                stepView.canProceed
                  ? 'bg-surface-button-tertiary-default hover:bg-surface-button-tertiary-hover active:bg-surface-button-tertiary-pressed text-content-inverse'
                  : 'bg-surface-disabled-primary text-content-disabled-primary cursor-not-allowed',
              )}
            >
              {isSubmitting ? '처리 중' : '다음'}
            </button>
          </div>
        </form>
      </ScreenColumn>

      <AlertDialog
        isOpen={dialogMessage !== null}
        message={dialogMessage ?? ''}
        onClose={() => setDialogMessage(null)}
      />
    </>
  );
}
