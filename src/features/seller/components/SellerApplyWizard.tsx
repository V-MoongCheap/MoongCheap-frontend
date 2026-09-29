'use client';

import { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import { ComingSoonButton } from '@/components/ui/ComingSoonButton';
import {
  SELLER_APPLY_BUSINESS,
  SELLER_APPLY_DONE,
  SELLER_APPLY_INTRO,
  SELLER_APPLY_STEPS,
} from '@/constants/sellerMessages';
import { useProgressRouter } from '@/hooks/useProgressRouter';
import { cn } from '@/lib/cn';
import { mockVerifyBusinessNumber } from '@/mocks/seller';
import { BUSINESS_NUMBER_LENGTH, businessNumberSchema } from '@/schemas/seller';

import { BusinessNumberField, type BusinessNumberStatus } from './BusinessNumberField';
import {
  ApprovalResultIcon,
  BusinessRegistrationIcon,
  NoticeQuestionIcon,
  SellerModeIcon,
} from './SellerApplyIcons';

// S-01 판매자 전환. 시안 453:25117(온보딩) · 25155~25195(번호 입력 4상태) · 25144(전환 완료).
//
// 한 라우트(/mypage/seller-apply)에서 스텝을 진행하고, 스텝은 URL 쿼리(?step=)로 표현한다.
// 회원가입 위저드와 같은 방식이라 브라우저 뒤로가기가 시안의 '이전' 버튼과 같은 곳으로 간다.
// useSearchParams는 클라이언트 훅이라 page.tsx에서 <Suspense>로 감싼다.
//
// ⚠️ API가 없다. 백엔드 셀러 구현이 MVP에서 통째로 빠져 있어(2026-09-02 팀장 확인) 사업자번호
//    조회는 mocks/seller.ts가 대신한다. 연동 시 mockVerifyBusinessNumber 호출부만 바꾸면 된다.
//
// ⚠️ 시안의 완료 화면 이름은 "S-01.승인 후 전환완료됨. 안내"다. 실제로는 심사가 끝난 뒤 별도로
//    도달하는 화면이고, 번호를 넣자마자 이어지는 화면이 아니다. 심사 상태를 알려 줄 API가 없어
//    지금은 '다음'에서 바로 잇는다. 연동 시 이 스텝은 승인 결과에 따라 진입하도록 바꾼다.

type SellerApplyStep = 'intro' | 'business' | 'done';

function isSellerApplyStep(value: string | null): value is SellerApplyStep {
  return value === 'intro' || value === 'business' || value === 'done';
}

/** 온보딩 카드의 아이콘. SELLER_APPLY_STEPS와 순서를 맞춘다. */
const STEP_ICONS = [BusinessRegistrationIcon, ApprovalResultIcon, SellerModeIcon];

/** 시안 버튼 실측: 높이 48 · radius 8 · button-15. 인증 화면(h-13)과 달라 여기서 따로 둔다. */
const BUTTON_BASE_CLASS =
  'text-button-15 rounded-8 focus-visible:ring-effect-focus-ring-primary flex h-12 w-full items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

const BUTTON_TERTIARY_CLASS =
  'bg-surface-button-tertiary-default hover:bg-surface-button-tertiary-hover active:bg-surface-button-tertiary-pressed text-content-inverse';

const BUTTON_QUARTERNARY_CLASS =
  'border-border-button-quarternary bg-surface-button-quarternary-default hover:bg-surface-button-quarternary-hover active:bg-surface-button-quarternary-pressed text-content-primary border';

const BUTTON_DISABLED_CLASS = 'bg-surface-disabled-secondary text-content-disabled-secondary';

interface ScreenHeaderProps {
  title: string;
  description: string;
}

/** 세 화면이 공유하는 제목 블록. 시안 `default` 인스턴스(393×96)에 대응한다. */
function ScreenHeader({ title, description }: ScreenHeaderProps) {
  return (
    <header className="flex w-full flex-col gap-1 p-4">
      <h1 className="text-heading-24 text-content-primary">{title}</h1>
      <p className="text-body-14 text-content-tertiary">{description}</p>
    </header>
  );
}

interface SellerApplyWizardProps {
  /**
   * 전환을 그만두고 돌아갈 경로. '나중에 하기'(온보딩)와 '구매자 계정 유지하기'(완료)가 함께 쓴다.
   *
   * 두 버튼의 목적지는 시안에 없다. 진입점이 어디냐에 따라 달라질 수 있어(마이페이지 외에
   * 판매자 유도 배너 등이 생길 수 있다) 컴포넌트가 경로를 들고 있지 않는다.
   */
  exitHref: string;
}

export function SellerApplyWizard({ exitHref }: SellerApplyWizardProps) {
  const router = useProgressRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const stepParam = searchParams.get('step');
  const step: SellerApplyStep = isSellerApplyStep(stepParam) ? stepParam : 'intro';

  const [businessNumber, setBusinessNumber] = useState('');
  // 어떤 값에 대해 조회했는지 함께 들고 있어야, 조회 후 값을 고쳤을 때 통과를 무효화할 수 있다.
  // (회원가입 위저드의 중복확인과 같은 구조.)
  const [check, setCheck] = useState<{
    state: 'idle' | 'checking' | 'verified' | 'notFound';
    forValue: string;
  }>({ state: 'idle', forValue: '' });

  const resolved = check.forValue === businessNumber ? check.state : 'idle';
  const verified = resolved === 'verified';

  const status: BusinessNumberStatus =
    resolved === 'verified' ? 'success' : resolved === 'notFound' ? 'error' : 'default';

  const helper =
    resolved === 'verified'
      ? SELLER_APPLY_BUSINESS.verified
      : resolved === 'notFound'
        ? SELLER_APPLY_BUSINESS.notFound
        : undefined;

  const goTo = (next: SellerApplyStep) => {
    router.push(`${pathname}?step=${next}`);
  };

  async function handleBusinessNumberChange(next: string) {
    // 숫자만 남긴다. 하이픈 자동 삽입은 시안에서 위치를 읽어낼 수 없어 하지 않는다(schemas/seller.ts).
    const digits = next.replace(/\D/g, '').slice(0, BUSINESS_NUMBER_LENGTH);
    setBusinessNumber(digits);
    // 값이 바뀌면 직전 조회 결과를 버린다(resolved가 idle로 떨어져 테두리가 기본으로 돌아간다).
    setCheck({ state: 'idle', forValue: '' });

    // 시안에 '확인' 버튼이 없고 success/error가 입력칸에 바로 뜬다. 그래서 자릿수가 차는 순간
    // 조회한다. 실제 API로 바뀌면 호출 빈도를 보고 디바운스를 검토한다.
    if (!businessNumberSchema.safeParse(digits).success) {
      return;
    }
    setCheck({ state: 'checking', forValue: digits });
    const result = await mockVerifyBusinessNumber(digits);
    setCheck({ state: result.ok ? 'verified' : 'notFound', forValue: digits });
  }

  function handleClear() {
    setBusinessNumber('');
    setCheck({ state: 'idle', forValue: '' });
  }

  if (step === 'business') {
    return (
      <div className="flex w-full flex-1 flex-col">
        <ScreenHeader
          description={SELLER_APPLY_BUSINESS.description}
          title={SELLER_APPLY_BUSINESS.title}
        />

        <div className="w-full p-4">
          <BusinessNumberField
            helper={helper}
            id="seller-business-number"
            label={SELLER_APPLY_BUSINESS.label}
            maxLength={BUSINESS_NUMBER_LENGTH}
            onChange={handleBusinessNumberChange}
            onClear={handleClear}
            placeholder={SELLER_APPLY_BUSINESS.placeholder}
            status={status}
            value={businessNumber}
          />
        </div>

        <div className="mt-auto flex w-full gap-2 p-4">
          <button
            className={cn(BUTTON_BASE_CLASS, BUTTON_QUARTERNARY_CLASS)}
            onClick={() => goTo('intro')}
            type="button"
          >
            {SELLER_APPLY_BUSINESS.prevLabel}
          </button>
          <button
            className={cn(
              BUTTON_BASE_CLASS,
              verified ? BUTTON_TERTIARY_CLASS : BUTTON_DISABLED_CLASS,
            )}
            disabled={!verified}
            onClick={() => goTo('done')}
            type="button"
          >
            {SELLER_APPLY_BUSINESS.nextLabel}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="flex w-full flex-1 flex-col">
        <ScreenHeader description={SELLER_APPLY_DONE.description} title={SELLER_APPLY_DONE.title} />

        {/* 시안 Frame 107(361×316). 미리보기 이미지가 카드보다 커서 아래가 잘린 채로 놓여 있다.
            시안 폭은 335.5인데 next/image가 정수 폭으로 srcset을 만들므로 336으로 올렸다(0.15% 차). */}
        <div className="w-full px-4">
          <div className="bg-surface-tertiary rounded-12 relative h-79 w-full overflow-hidden">
            <Image
              alt=""
              className="absolute top-19.75 left-1/2 -translate-x-1/2"
              height={261}
              priority
              src="/images/seller-apply-preview.webp"
              width={336}
            />
          </div>
        </div>

        <div className="mt-auto flex w-full flex-col gap-2 p-4">
          {/* 판매자 화면(S-02 이후)이 아직 하나도 없어 이동할 곳이 없다. 미구현 진입점 규칙대로
              '준비 중' 토스트를 띄운다(의사결정 기록 2026-08-28). */}
          <ComingSoonButton className={cn(BUTTON_BASE_CLASS, BUTTON_TERTIARY_CLASS)}>
            {SELLER_APPLY_DONE.sellLabel}
          </ComingSoonButton>
          <Link className={cn(BUTTON_BASE_CLASS, BUTTON_QUARTERNARY_CLASS)} href={exitHref}>
            {SELLER_APPLY_DONE.keepBuyerLabel}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-1 flex-col">
      <ScreenHeader description={SELLER_APPLY_INTRO.description} title={SELLER_APPLY_INTRO.title} />

      {/* 순서가 곧 전환 절차라 ol로 둔다. 시안은 번호를 그리지 않으므로 마커는 감춘다. */}
      <ol className="flex w-full list-none flex-col gap-4 px-4 pt-5">
        {SELLER_APPLY_STEPS.map(({ title, description }, index) => {
          const Icon = STEP_ICONS[index];
          return (
            <li
              className="bg-surface-primary rounded-12 flex w-full items-center gap-2 p-4"
              key={title}
            >
              <Icon />
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="text-title-17 text-content-primary">{title}</p>
                <p className="text-body-14 text-content-tertiary">{description}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-auto flex w-full flex-col gap-2 p-4">
        <p className="text-body-14 text-content-quarternary flex items-center gap-2">
          <NoticeQuestionIcon />
          {SELLER_APPLY_INTRO.notice}
        </p>

        <button
          className={cn(BUTTON_BASE_CLASS, BUTTON_TERTIARY_CLASS)}
          onClick={() => goTo('business')}
          type="button"
        >
          {SELLER_APPLY_INTRO.applyLabel}
        </button>
        <Link className={cn(BUTTON_BASE_CLASS, BUTTON_QUARTERNARY_CLASS)} href={exitHref}>
          {SELLER_APPLY_INTRO.laterLabel}
        </Link>
      </div>
    </div>
  );
}
