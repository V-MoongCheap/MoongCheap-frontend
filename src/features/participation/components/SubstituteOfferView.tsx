'use client';

import { useState } from 'react';

import { ArrowDown, PackageOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { AlertDialog } from '@/components/ui/AlertDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ERROR_ACTION_CLASS, ErrorScreen } from '@/components/ui/ErrorScreen';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { ERROR_SCREEN_RETRY_LABEL, SESSION_EXPIRED_MESSAGE } from '@/constants/commonMessages';
import {
  ACCEPT_SUBSTITUTE_DIALOG,
  REJECT_SUBSTITUTE_DIALOG,
  SUBSTITUTE_OFFER_COPY,
  SUBSTITUTE_OFFER_TOAST,
} from '@/constants/substituteOffer';
import {
  useAcceptSubstituteOffer,
  useRejectSubstituteOffer,
  useSubstituteOffer,
} from '@/features/participation/hooks/useSubstituteOffer';
import { ApiError } from '@/lib/api';
import { SUBSTITUTE_OFFER_ERROR_CODE } from '@/lib/demandApi';
import { formatWon } from '@/lib/formatPrice';
import type { SubstituteProductSummary } from '@/types/substituteOffer';

// 수락/거절이 더는 유효하지 않음을 뜻하는 백엔드 비즈니스 코드(이미 처리·만료·권한·없음). 이 코드로
// 오면 재시도가 무의미하니 '지난 제안'으로 안내하고 목록으로 돌려보낸다.
const GONE_ERROR_CODES: readonly string[] = [
  SUBSTITUTE_OFFER_ERROR_CODE.NOT_FOUND,
  SUBSTITUTE_OFFER_ERROR_CODE.NOT_ALLOWED,
  SUBSTITUTE_OFFER_ERROR_CODE.DESIRE_EXPIRED,
  SUBSTITUTE_OFFER_ERROR_CODE.FORBIDDEN,
];

// B-16 대체상품 수락/거절. B-17 확인필요 탭의 대체상품 제안 카드 → 이 화면으로 진입한다.
//
// 데이터·수락·거절 모두 실API(client)로 한다 — 세션(SID httpOnly 쿠키)이 필요해 서버 컴포넌트에서
// 부르면 401이 된다(`lib/demandApi.ts` 주석). 페이지(서버 컴포넌트)는 AppBar만 조립한다.
//
// ⚠️ 디자인팀 휴가로 전용 시안이 없다(이슈 #136). 기존 컴포넌트 규칙(B-19 낙찰 결과의 상품 카드·
//    하단 CTA, 공용 ErrorScreen·EmptyState·Skeleton)을 재사용한다. 연휴 후 디자인 리뷰 시 교체한다.
//
// ⚠️ 거절 결과 상태는 백엔드가 UNASSIGNED(모이는 중)로 되돌린다(이슈의 EXPIRED와 다름). 상세는
//    `lib/demandApi.ts`/`constants/substituteOffer.ts` 주석. 화면은 성공 후 목록으로 돌아가고,
//    무효화된 목록이 서버 기준 탭에 카드를 다시 그린다.

/**
 * 수락/거절 실패 토스트 문구를 고른다. 401은 재로그인, 제안이 더는 유효하지 않은 비즈니스 코드
 * (`GONE_ERROR_CODES`)는 '지난 제안', 그 밖(네트워크·서버·미상 코드)은 일반 실패다.
 *
 * status(400/404/403)가 아니라 `error.code`로 가르는 이유: 같은 400이라도 대체 오퍼 고유 코드
 * (DEMAND_007/009 등)만 '지난 제안'으로 목록에 돌려보내고, 그 외 400(예: 일반 검증 오류)은 그 자리에
 * 두어 재시도하게 한다(status만으로는 구분 불가 — `lib/api.ts` ApiError 주석과 같은 방침).
 */
function offerActionErrorMessage(caught: unknown): string {
  if (!(caught instanceof ApiError)) {
    return SUBSTITUTE_OFFER_TOAST.failed;
  }
  if (caught.status === 401) {
    return SESSION_EXPIRED_MESSAGE;
  }
  if (caught.code !== null && GONE_ERROR_CODES.includes(caught.code)) {
    return SUBSTITUTE_OFFER_TOAST.gone;
  }
  return SUBSTITUTE_OFFER_TOAST.failed;
}

/** 상품 요약 카드(원 수요·대체상품 공통). 썸네일은 원본 미연동이라 회색 placeholder(B-19와 같은 규칙). */
function ProductSummaryCard({ product }: { product: SubstituteProductSummary }) {
  return (
    <div className="bg-surface-secondary rounded-16 flex items-center gap-3 p-3">
      <div aria-hidden className="bg-surface-tertiary rounded-12 size-14 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-body-15 text-content-primary truncate font-semibold">{product.name}</p>
        {product.specSummary !== undefined && (
          <p className="text-caption-12 text-content-quarternary truncate">{product.specSummary}</p>
        )}
        {product.listPrice !== undefined && (
          <p className="text-caption-12 text-content-quarternary">
            {SUBSTITUTE_OFFER_COPY.listPriceLabel} {formatWon(product.listPrice)}
          </p>
        )}
      </div>
    </div>
  );
}

/** 내 참여 조건 한 행. */
function ConditionRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-body-15 text-content-quarternary">{label}</span>
      <span className="text-body-15 text-content-primary">{value}</span>
    </div>
  );
}

interface SubstituteOfferViewProps {
  demandId: string;
  /** 뒤로·완료 후 이동할 참여 목록(B-17) 경로. 라우트 문자열은 페이지가 주입한다. */
  listHref: string;
}

export function SubstituteOfferView({ demandId, listHref }: SubstituteOfferViewProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isAcceptOpen, setIsAcceptOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  const { data, isPending, isError, refetch } = useSubstituteOffer(demandId);
  const acceptMutation = useAcceptSubstituteOffer(demandId);
  const rejectMutation = useRejectSubstituteOffer(demandId);

  const isProcessing = acceptMutation.isPending || rejectMutation.isPending;

  // 수락/거절 성공: 안내 토스트 후 목록으로 돌아간다. replace라 뒤로가기로 (처리 끝난) 이 화면에
  // 되돌아오지 않는다. 무효화된 목록이 서버 기준 상태로 다시 그려진다.
  function handleSettled(successMessage: string) {
    showToast(successMessage);
    router.replace(listHref);
  }

  // 실패: '이미 처리·만료·권한'(4xx)이면 재시도가 무의미하니 목록으로 보낸다. 세션 만료·일시 오류는
  // 그 자리에 두어 다시 시도할 수 있게 한다.
  function handleError(caught: unknown) {
    const message = offerActionErrorMessage(caught);
    showToast(message);
    if (message === SUBSTITUTE_OFFER_TOAST.gone) {
      router.replace(listHref);
    }
  }

  function handleConfirmAccept() {
    setIsAcceptOpen(false);
    acceptMutation.mutate(undefined, {
      onSuccess: () => handleSettled(SUBSTITUTE_OFFER_TOAST.acceptSuccess),
      onError: handleError,
    });
  }

  function handleConfirmReject() {
    setIsRejectOpen(false);
    rejectMutation.mutate(undefined, {
      onSuccess: () => handleSettled(SUBSTITUTE_OFFER_TOAST.rejectSuccess),
      onError: handleError,
    });
  }

  // 첫 조회 중.
  if (isPending) {
    return (
      <div aria-busy className="flex w-full flex-1 flex-col gap-4 px-4 pt-6" role="status">
        <span className="sr-only">대체상품 제안을 불러오는 중</span>
        <Skeleton className="rounded-16 h-24 w-full" />
        <Skeleton className="rounded-16 h-24 w-full" />
        <Skeleton className="rounded-12 h-16 w-full" />
      </div>
    );
  }

  // 첫 조회 실패.
  if (isError || data === undefined) {
    return (
      <ErrorScreen>
        <button className={ERROR_ACTION_CLASS} onClick={() => void refetch()} type="button">
          {ERROR_SCREEN_RETRY_LABEL}
        </button>
      </ErrorScreen>
    );
  }

  // 이미 처리됐거나 제안 상태가 아님(직접 진입·처리 후 재방문). 목록으로 돌아가게 안내한다.
  if (!data.isOffer || data.substitute === null) {
    return (
      <EmptyState
        action={
          <button
            className={ERROR_ACTION_CLASS}
            onClick={() => router.replace(listHref)}
            type="button"
          >
            목록으로 돌아가기
          </button>
        }
        className="flex-1"
        description="이미 처리되었거나 기간이 지난 제안이에요."
        icon={<PackageOpen aria-hidden className="size-12" />}
        title="확인할 대체상품 제안이 없어요"
      />
    );
  }

  // 위 가드로 substitute가 null이 아님이 확정된다(로컬 const로 좁힘을 유지).
  const substitute = data.substitute;

  return (
    <div className="flex w-full flex-1 flex-col">
      <div className="flex flex-1 flex-col px-4 pt-6">
        <h2 className="text-heading-22 text-content-primary">{SUBSTITUTE_OFFER_COPY.heading}</h2>
        <p className="text-body-14 text-content-quarternary mt-2">
          {SUBSTITUTE_OFFER_COPY.description}
        </p>

        {/* 내가 등록한 수요 → AI 제안 대체상품. 두 카드 사이 화살표로 대체 관계를 표시한다. */}
        <p className="text-label-13 text-content-quarternary mt-8 mb-2">
          {SUBSTITUTE_OFFER_COPY.requestedLabel}
        </p>
        <ProductSummaryCard product={data.requested} />

        <div aria-hidden className="my-3 flex justify-center">
          <ArrowDown className="text-content-quinary size-5" />
        </div>

        <p className="text-label-13 text-content-brand mb-2">
          {SUBSTITUTE_OFFER_COPY.substituteLabel}
        </p>
        <ProductSummaryCard product={substitute} />

        <div className="border-divider-default my-6 border-t" />

        <div className="flex flex-col gap-3">
          {data.quantity !== undefined && (
            <ConditionRow
              label={SUBSTITUTE_OFFER_COPY.quantityLabel}
              value={`${data.quantity}개`}
            />
          )}
          {data.desiredPriceLabel !== '' && (
            <ConditionRow
              label={SUBSTITUTE_OFFER_COPY.desiredPriceLabel}
              value={data.desiredPriceLabel}
            />
          )}
        </div>
      </div>

      {/* 하단 CTA. [거절하기](보조) · [수락하기](코랄 primary). 처리 중 둘 다 비활성. */}
      <div className="flex gap-2 px-4 pt-6 pb-6">
        <button
          type="button"
          disabled={isProcessing}
          onClick={() => setIsRejectOpen(true)}
          className="bg-surface-secondary text-content-primary text-button-15 active:bg-surface-tertiary focus-visible:ring-effect-focus-ring-primary rounded-16 flex h-13 flex-1 items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60"
        >
          {SUBSTITUTE_OFFER_COPY.rejectCta}
        </button>
        <button
          type="button"
          disabled={isProcessing}
          onClick={() => setIsAcceptOpen(true)}
          className="bg-surface-button-primary-default text-content-oncolor text-button-15 active:bg-surface-button-primary-pressed focus-visible:ring-effect-focus-ring-primary rounded-16 flex h-13 flex-1 items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60"
        >
          {SUBSTITUTE_OFFER_COPY.acceptCta}
        </button>
      </div>

      <AlertDialog
        cancelLabel={ACCEPT_SUBSTITUTE_DIALOG.cancelLabel}
        confirmLabel={ACCEPT_SUBSTITUTE_DIALOG.confirmLabel}
        isOpen={isAcceptOpen}
        isProcessing={acceptMutation.isPending}
        message={ACCEPT_SUBSTITUTE_DIALOG.message}
        onClose={() => setIsAcceptOpen(false)}
        onConfirm={handleConfirmAccept}
        title={ACCEPT_SUBSTITUTE_DIALOG.title}
      />

      <AlertDialog
        cancelLabel={REJECT_SUBSTITUTE_DIALOG.cancelLabel}
        confirmLabel={REJECT_SUBSTITUTE_DIALOG.confirmLabel}
        isOpen={isRejectOpen}
        isProcessing={rejectMutation.isPending}
        message={REJECT_SUBSTITUTE_DIALOG.message}
        onClose={() => setIsRejectOpen(false)}
        onConfirm={handleConfirmReject}
        title={REJECT_SUBSTITUTE_DIALOG.title}
      />
    </div>
  );
}
