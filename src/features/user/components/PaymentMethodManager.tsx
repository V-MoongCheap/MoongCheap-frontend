'use client';

import { useState } from 'react';

import Image from 'next/image';

import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useToast } from '@/components/ui/Toast';
import { EXCEPTION_ASSETS } from '@/constants/assets';
import { PAYMENT_METHOD_MAX } from '@/constants/businessRules';
import { ERROR_SCREEN_RETRY_LABEL, SESSION_EXPIRED_MESSAGE } from '@/constants/commonMessages';
import { PAYMENT_METHOD_MESSAGES } from '@/constants/paymentMethodMessages';
import { PaymentMethodCard } from '@/features/user/components/PaymentMethodCard';
import { PaymentMethodListSkeleton } from '@/features/user/components/PaymentMethodListSkeleton';
import {
  usePaymentMethods,
  useSetDefaultPaymentMethod,
} from '@/features/user/hooks/usePaymentMethods';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';
import { PAYMENT_ERROR_CODE } from '@/types/api/payment';

// B-14 결제수단 관리(FN-B14-01). 목록 조회 + 기본결제수단 변경까지가 이 화면의 MVP 범위다.
//
// 조회는 client에서 한다(`usePaymentMethods` 주석). 페이지는 서버 컴포넌트로 앱바만 조립한다.
//
// 이번 범위에서 뺀 것(명세·결정 근거):
//  · 카드 추가: 토스 브랜드페이 SDK 등록은 2026-09-23 범위 조정으로 제외했다(Swagger로 대신).
//    진입점은 노출하되 '준비 중' 토스트.
//  · 삭제(편집 모드): FN-B14-04 Full·⚠️TBD 미확정. '편집' 진입점은 노출하되 '준비 중' 토스트.
//  · 기본변경 모드 백버튼 복귀(BR-13): 뒤로가기 가로채기가 필요해 뺐다. 백버튼은 진입 경로로 간다.

type Mode = 'view' | 'changeDefault';

// 시안의 카드 추가 글리프 — 회색 원형 배경 안에 흰 '+'. lucide Plus는 획이 얇아 시안과 달라
// 채워진 '+' 경로(배송지 목록과 동일 글리프)를 옮겼다.
function AddGlyph() {
  return (
    <span className="bg-content-disabled-primary flex size-6 shrink-0 items-center justify-center rounded-full">
      <svg
        aria-hidden
        className="text-content-inverse size-3.5"
        fill="currentColor"
        viewBox="0 0 22 22"
      >
        <path d="M17.1328 10.1328C17.6118 10.1328 18 10.521 18 11C18 11.479 17.6118 11.8672 17.1328 11.8672H11.8672V17.1328C11.8672 17.6118 11.479 18 11 18C10.521 18 10.1328 17.6118 10.1328 17.1328V11.8672H4.86721C4.38824 11.8672 4.00003 11.479 4 11C4 10.521 4.38821 10.1328 4.86721 10.1328H10.1328V4.86721C10.1328 4.38821 10.521 4 11 4C11.479 4 11.8672 4.38821 11.8672 4.86721V10.1328H17.1328Z" />
      </svg>
    </span>
  );
}

/**
 * 기본 변경 실패 토스트 문구를 고른다. 401(세션 만료)만 재로그인 안내로 따로 두고, 나머지는
 * 명세 문구 하나로 묶는다(`AddressListView`의 기본 지정 실패와 같은 방침).
 */
function changeDefaultErrorMessage(caught: unknown): string {
  if (caught instanceof ApiError && caught.status === 401) {
    return SESSION_EXPIRED_MESSAGE;
  }
  return PAYMENT_METHOD_MESSAGES.changeDefaultFailed;
}

export function PaymentMethodManager() {
  const { methods, error, refetch } = usePaymentMethods();
  const setDefault = useSetDefaultPaymentMethod();
  const { showToast, showComingSoon } = useToast();
  const [mode, setMode] = useState<Mode>('view');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // 빈 목록(등록 카드 0건). 안내 문구 + '카드 등록하기'만 노출한다(FN-B14-01 화면상태 '빈 목록').
  if (methods !== null && methods.length === 0) {
    return (
      <EmptyState
        action={
          <button
            className="bg-surface-button-tertiary-default text-content-inverse text-label-14 active:bg-surface-button-tertiary-pressed rounded-full px-6 py-3.5"
            onClick={showComingSoon}
            type="button"
          >
            카드 등록하기
          </button>
        }
        className="flex-1"
        description="결제에 사용할 카드를 등록해 주세요."
        icon={
          // B-14 empty 시안의 지갑 일러스트(Figma node 755:16137, 160×146). 장식용이라 alt는 빈 값.
          <Image alt="" height={146} priority src={EXCEPTION_ASSETS.emptyPayment} width={160} />
        }
        title="등록된 카드가 없어요"
      />
    );
  }

  const isLoaded = methods !== null;
  const defaultId = methods?.find((method) => method.isDefault)?.id ?? null;
  // 기본으로 바꿀 대상(선택 가능하면서 기본이 아닌 것)이 있을 때만 기본변경 모드에 들어간다.
  // 명세는 '2건 이상'이지만, 나머지가 전부 선택 불가(INACTIVE)면 들어가도 고를 것이 없다.
  const canChangeDefault =
    methods?.some((method) => method.isSelectable && !method.isDefault) ?? false;
  const atMax = isLoaded && methods.length >= PAYMENT_METHOD_MAX;
  const isChanging = setDefault.isPending;
  // 선택 대상이 지금 목록에서 여전히 고를 수 있는지까지 본다. 변경 실패(404)로 목록을 다시 받은 뒤
  // 그 결제수단이 사라졌거나 비활성이 됐으면 CTA를 다시 잠가 같은 실패를 반복하지 않게 한다.
  const selectedMethod = methods?.find((method) => method.id === selectedId);
  const canApply =
    mode === 'changeDefault' &&
    selectedMethod !== undefined &&
    selectedMethod.isSelectable &&
    !selectedMethod.isDefault &&
    !isChanging;

  function enterChangeDefault() {
    setSelectedId(defaultId);
    setMode('changeDefault');
  }

  // 기본변경 확정. 성공하면 훅이 목록을 다시 받고(기본 우선 정렬은 서버가 한다) 조회 모드로 돌아간다.
  //
  // 실패하면 명세대로 선택과 CTA를 그대로 두고 토스트만 띄운다(재시도 = CTA 재탭). 라디오는 요청 중에만
  // 잠겼다가 풀린다. 404(`PAY_001`)는 고른 결제수단이 그사이 삭제·비활성된 경우라 목록을 다시 받는다.
  function applyDefaultChange() {
    if (!canApply) return;
    setDefault.mutate(selectedMethod.id, {
      onSuccess: () => {
        setMode('view');
        showToast(PAYMENT_METHOD_MESSAGES.defaultChanged);
      },
      onError: (caught) => {
        if (caught instanceof ApiError && caught.code === PAYMENT_ERROR_CODE.methodNotFound) {
          refetch();
        }
        showToast(changeDefaultErrorMessage(caught));
      },
    });
  }

  return (
    <div className="flex w-full flex-1 flex-col">
      <div className="flex w-full flex-1 flex-col gap-3 px-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-section-title-16 text-content-primary">등록된 결제 수단</h2>
          {/* 편집 = 삭제 모드(BR-08). FN-B14-04 미확정이라 진입점만 두고 '준비 중' 토스트.
              시안은 회색 채운 pill. */}
          <button
            className="bg-surface-secondary text-label-14 text-content-quarternary active:bg-surface-tertiary rounded-full px-3.5 py-1.5"
            onClick={showComingSoon}
            type="button"
          >
            편집
          </button>
        </div>

        {/* 목록 영역. 조회 실패·조회 중에도 헤더·편집·CTA는 그대로 두고 이 자리만 바꾼다(명세 화면상태). */}
        {error !== null ? (
          <ErrorState
            message={PAYMENT_METHOD_MESSAGES.loadFailed}
            onRetry={refetch}
            retryLabel={ERROR_SCREEN_RETRY_LABEL}
          />
        ) : methods === null ? (
          <PaymentMethodListSkeleton />
        ) : (
          <ul className="flex w-full flex-col gap-3">
            {methods.map((method) =>
              mode === 'changeDefault' ? (
                <PaymentMethodCard
                  key={method.id}
                  locked={isChanging}
                  method={method}
                  onSelect={() => setSelectedId(method.id)}
                  selected={selectedId === method.id}
                  variant="select"
                />
              ) : (
                <PaymentMethodCard
                  key={method.id}
                  method={method}
                  onActivate={canChangeDefault ? enterChangeDefault : undefined}
                  variant="view"
                />
              ),
            )}
          </ul>
        )}

        {atMax ? (
          // 상한(5건) 도달: 비활성 + '+' 미노출(BR-07). 문구는 🖌️ 디자인 확정 전 임시.
          <p className="bg-surface-secondary text-caption-12 text-content-quarternary rounded-12 px-4 py-5 text-center">
            결제 카드는 최대 {PAYMENT_METHOD_MAX}개까지 등록할 수 있어요
          </p>
        ) : (
          // 조회 중·조회 실패에는 흐리게 잠근다(명세 화면상태). 개수를 모르면 상한 여부도 모른다.
          <button
            className={cn(
              'bg-surface-secondary text-label-14 rounded-12 flex w-full flex-col items-center justify-center gap-1.5 px-4 py-5',
              isLoaded
                ? 'text-content-tertiary active:bg-surface-tertiary'
                : 'text-content-disabled-primary',
            )}
            disabled={!isLoaded}
            onClick={showComingSoon}
            type="button"
          >
            <AddGlyph />
            결제 카드 추가하기
          </button>
        )}
      </div>

      {mode === 'changeDefault' && (
        <div className="sticky bottom-0 w-full px-4 pt-3 pb-6">
          <button
            aria-busy={isChanging}
            className="bg-surface-button-tertiary-default text-content-inverse text-label-16 rounded-12 active:bg-surface-button-tertiary-pressed disabled:bg-surface-button-quarternary-default disabled:text-content-disabled-primary w-full py-4"
            disabled={!canApply}
            onClick={applyDefaultChange}
            type="button"
          >
            {isChanging
              ? PAYMENT_METHOD_MESSAGES.changingDefaultCta
              : PAYMENT_METHOD_MESSAGES.changeDefaultCta}
          </button>
        </div>
      )}
    </div>
  );
}
