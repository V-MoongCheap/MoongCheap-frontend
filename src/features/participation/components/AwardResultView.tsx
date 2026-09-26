'use client';

import { useState } from 'react';

import { PackageOpen } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { AlertDialog } from '@/components/ui/AlertDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ERROR_ACTION_CLASS, ErrorScreen } from '@/components/ui/ErrorScreen';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { AWARD_RESULT_ASSETS } from '@/constants/assets';
import { CANCEL_AWARD_DIALOG } from '@/constants/awardCancel';
import { ERROR_SCREEN_RETRY_LABEL } from '@/constants/commonMessages';
import { useRedirectOnUnauthorized } from '@/features/auth/session';
import { useAwardResult } from '@/features/participation/hooks/useAwardResult';
import { ApiError } from '@/lib/api';
import { formatWon } from '@/lib/formatPrice';
import { isRenderableImageSrc } from '@/lib/imageSource';

// B-19 낙찰 성공 정보. 낙찰 결과(축하 일러스트 + 상품·금액 요약) + 하단 CTA로 구성한다.
//
// 이 화면은 "48시간 내 자동결제 대기" 상태의 상세라, 하단 CTA가 '뭉치 낙찰 취소하기'다(자동결제
// 전까지 취소 가능). 취소 흐름은 B-17 목록과 같은 확인 다이얼로그를 공유한다(constants/awardCancel.ts).
// 실제 취소·상태 전이 배선은 BE 규격 확정 시.
//
// 값은 실데이터만 그린다. 응답에 없는 값은 줄을 숨기고, 조회 전에는 스켈레톤을 그린다(#187 —
// 예전에는 mock을 먼저 그리고 응답으로 덮어, mock이 실데이터처럼 보였다).
const HEADLINE = '낙찰 되었어요!';
/** 자동결제 예정 시각이 응답에 없을 때의 안내 문구. */
const SUBHEAD_FALLBACK = '48시간 후 등록된 결제수단으로 자동결제돼요.';

/** 낙찰 결과가 없을 때(없는 보드·아직 낙찰 전·내 수요 없음) 백엔드가 주는 상태 코드. */
const NOT_FOUND_STATUS = 404;

/** 요약 표 한 행. label은 좌측 회색, value는 우측. emphasized면 양쪽을 강조한다. */
function SummaryRow({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span
        className={
          emphasized
            ? 'text-body-15 text-content-primary font-bold'
            : 'text-body-15 text-content-quarternary'
        }
      >
        {label}
      </span>
      <span
        className={
          emphasized
            ? 'text-body-15 text-content-primary font-bold'
            : 'text-body-15 text-content-primary'
        }
      >
        {value}
      </span>
    </div>
  );
}

function AwardResultSkeleton() {
  return (
    <div aria-busy className="flex w-full flex-1 flex-col gap-4 px-4 pt-8" role="status">
      <span className="sr-only">낙찰 결과를 불러오는 중</span>
      <Skeleton className="mx-auto size-30 rounded-full" />
      <Skeleton className="rounded-16 h-20 w-full" />
      <Skeleton className="rounded-16 h-24 w-full" />
      <Skeleton className="rounded-16 h-24 w-full" />
    </div>
  );
}

interface AwardResultViewProps {
  /** 조회 대상 수요보드 id. 경로 파라미터를 페이지가 그대로 넘긴다. */
  demandBoardId: string;
  /** 결과가 없을 때 돌아갈 목록(B-17) 경로. 라우트 문자열은 페이지가 주입한다. */
  listHref: string;
}

export function AwardResultView({ demandBoardId, listHref }: AwardResultViewProps) {
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const isValidId = /^\d+$/.test(demandBoardId);
  const { data: result, error, isError, isPending, refetch } = useAwardResult(demandBoardId);
  // 세션 만료(401)는 재시도해도 소용없어 오류 화면 대신 로그인 화면으로 보낸다(#159).
  const isRedirectingToLogin = useRedirectOnUnauthorized(error);

  // 낙찰 취소 확정(mock). 실제 서버 취소·화면 이탈은 BE 연동 시. 지금은 안내 토스트만 띄운다.
  function handleConfirmCancel() {
    setIsCancelOpen(false);
    showToast(CANCEL_AWARD_DIALOG.successToast);
  }

  // 결과 없음: 숫자가 아닌 주소, 또는 백엔드 404(없는 보드·낙찰 전·내 수요 없음).
  const isNotFound = !isValidId || (error instanceof ApiError && error.status === NOT_FOUND_STATUS);
  if (isNotFound) {
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
        description="아직 낙찰 전이거나 확인할 수 없는 공구예요."
        icon={<PackageOpen aria-hidden className="size-12" />}
        title="확인할 낙찰 결과가 없어요"
      />
    );
  }

  if (isPending || isRedirectingToLogin) {
    return <AwardResultSkeleton />;
  }

  if (isError) {
    return (
      <ErrorScreen>
        <button className={ERROR_ACTION_CLASS} onClick={() => void refetch()} type="button">
          {ERROR_SCREEN_RETRY_LABEL}
        </button>
      </ErrorScreen>
    );
  }

  const subhead =
    result.paymentDeadlineLabel === undefined
      ? SUBHEAD_FALLBACK
      : `${result.paymentDeadlineLabel}에 등록된 결제수단으로 자동결제돼요.`;

  return (
    <div className="flex w-full flex-1 flex-col">
      <div className="flex flex-1 flex-col px-4">
        {/* 낙찰 축하 일러스트. 제목이 상태를 설명하므로 삽화는 장식으로 둔다(alt="").
            파일은 4x(476×480) 원본이고 width/height는 표시 크기다. next/image가
            srcset으로 화면 배율에 맞춰 내려보낸다. */}
        <Image
          src={AWARD_RESULT_ASSETS.celebrate}
          alt=""
          width={119}
          height={120}
          priority
          className="mx-auto mt-8"
        />

        <h2 className="text-heading-22 text-content-primary mt-4 text-center">{HEADLINE}</h2>
        <p className="text-body-14 text-content-quarternary mt-1 text-center">{subhead}</p>

        {/* 상품 카드. 썸네일은 앱이 서빙하는 경로일 때만 그리고, 아니면 회색 자리를 둔다
            (외부 URL은 next/image가 던진다 — lib/imageSource.ts). */}
        <div className="bg-surface-secondary rounded-16 mt-8 flex items-center gap-3 p-3">
          <div
            aria-hidden
            className="bg-surface-tertiary rounded-12 relative size-14 shrink-0 overflow-hidden"
          >
            {isRenderableImageSrc(result.thumbnailUrl) && (
              <Image alt="" className="object-cover" fill sizes="56px" src={result.thumbnailUrl} />
            )}
          </div>
          <p className="text-body-15 text-content-primary min-w-0 truncate font-semibold">
            {result.productName}
          </p>
        </div>

        {/* 금액·낙찰 요약. 두 개의 구분선으로 3개 블록으로 나눈다. 값이 없는 줄은 숨긴다. */}
        <div className="mt-6 flex flex-col gap-3">
          {result.finalBidPrice !== undefined && (
            <SummaryRow emphasized label="최종 낙찰가" value={formatWon(result.finalBidPrice)} />
          )}
          {result.desiredPriceLabel !== undefined && (
            <SummaryRow label="희망가" value={result.desiredPriceLabel} />
          )}
          {result.myQuantity !== undefined && (
            <SummaryRow label="내 참여 수량" value={`${result.myQuantity}개`} />
          )}
        </div>

        <div className="border-divider-default my-4 border-t" />

        <div className="flex flex-col gap-3">
          {result.sellerName !== undefined && (
            <SummaryRow label="셀러명" value={result.sellerName} />
          )}
          {result.participantCount !== undefined && (
            <SummaryRow
              label="참여 뭉치단"
              value={`${result.participantCount.toLocaleString('ko-KR')}명`}
            />
          )}
          {result.totalParticipantQuantity !== undefined && (
            <SummaryRow
              label="총 참여 수량"
              value={`${result.totalParticipantQuantity.toLocaleString('ko-KR')}개`}
            />
          )}
        </div>

        {result.expectedPaymentPrice !== undefined && (
          <>
            <div className="border-divider-default my-4 border-t" />
            <div className="flex items-center justify-between gap-3">
              <span className="text-heading-18 text-content-primary">결제 예정 금액</span>
              <span className="text-heading-18 text-content-brand">
                {formatWon(result.expectedPaymentPrice)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* 하단 CTA. 코랄 필 primary 버튼. 공통 primary 버튼 컴포넌트 규약 확정 시 그것으로 교체한다.
          전체폭 CTA 타이포·높이는 디자인 컨벤션(§10)의 text-button-15 · h-13(52) 표준을 따른다. */}
      <div className="px-4 pt-6 pb-6">
        <button
          type="button"
          onClick={() => setIsCancelOpen(true)}
          className="bg-surface-button-primary-default text-content-oncolor text-button-15 active:bg-surface-button-primary-pressed focus-visible:ring-effect-focus-ring-primary rounded-16 flex h-13 w-full items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          뭉치 낙찰 취소하기
        </button>
      </div>

      <AlertDialog
        cancelLabel={CANCEL_AWARD_DIALOG.cancelLabel}
        confirmLabel={CANCEL_AWARD_DIALOG.confirmLabel}
        isOpen={isCancelOpen}
        message={CANCEL_AWARD_DIALOG.message}
        onClose={() => setIsCancelOpen(false)}
        onConfirm={handleConfirmCancel}
        title={CANCEL_AWARD_DIALOG.title}
      />
    </div>
  );
}
