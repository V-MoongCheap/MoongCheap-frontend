'use client';

import type { ReactNode } from 'react';

import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { AppBar } from '@/components/layout/AppBar';
import { ERROR_ACTION_CLASS, ErrorScreen } from '@/components/ui/ErrorScreen';
import { ErrorState } from '@/components/ui/ErrorState';
import { GoBackButton } from '@/components/ui/GoBackButton';
import { Skeleton } from '@/components/ui/Skeleton';
import { ERROR_SCREEN_RETRY_LABEL } from '@/constants/commonMessages';
import { DEMAND_BOARD_DETAIL } from '@/constants/demandBoardMessages';
import { useRedirectOnUnauthorized } from '@/features/auth/session';
import { useDemandBoard } from '@/features/demand/hooks/useDemandBoard';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';
import {
  DEMAND_BOARD_ERROR_CODE,
  formatDemandBoardDeadline,
  isDemandBoardClosed,
  remainingUntil,
  toDemandBoardId,
} from '@/lib/demandBoardApi';
import { isRenderableImageSrc } from '@/lib/imageSource';

// B-12 수요 상세(MC-B12-01). 상품 상세(B-08)의 퀵 참여 카드에서 들어온다.
//
// 시안이 없어 명세 구성 요소를 수요 등록(B-09) 화면의 카드 모양으로 그린다. 문구 출처는
// `constants/demandBoardMessages.ts`.
//
//   상품 요약(이미지·상품명, 탭 → 상품 상세) · 확정 수요 인원 · 남은 시간 · 마감 일시 · 희망 가격대 · 응찰 수
//   하단 고정 CTA: 함께 신청하기 / 참여 중 · 내 대기에서 확인 / 마감된 공구예요(비활성)
//
// 명세의 '일정 타임라인'은 이 화면에 그리지 않는다. [함께 신청하기]가 뭉치 진행 과정 안내
// (`DemandGuideView`)를 거쳐 퀵 참여로 가므로 참여 직전에 같은 안내를 본다(B-08 → B-09와 같은 흐름).
//
// 인원·남은 시간·마감 여부는 조회 시점 기준이다(명세 '조회 시점 스냅숏, 마감 도달은 재조회 시점에
// 화면 반영'). 그래서 현재 시각 대신 조회 시각(`dataUpdatedAt`)으로 계산한다.

/** 하단 CTA 공통 모양. 상품 상세·수요 등록의 하단 버튼과 같다. */
const CTA_CLASS = 'text-button-15 rounded-8 flex h-12 w-full items-center justify-center';

interface DemandBoardDetailViewProps {
  /** 라우트의 수요보드 id. 숫자가 아니면 조회하지 않고 없는 보드로 그린다. */
  demandBoardId: string;
  /** 앱바 뒤로가기의 대체 경로(히스토리가 없을 때). 라우트는 호출부(page)가 정한다. */
  backHref: string;
  /** [함께 신청하기]가 갈 곳(진행 과정 안내 → 퀵 참여). */
  joinHref: string;
  /** 참여 중일 때 CTA가 갈 내 대기(B-17). */
  participationListHref: string;
  /** 상품 요약 탭 시 갈 상품 상세 경로의 앞부분. 여기에 `/{catalogId}`를 붙인다. */
  productHrefBase: string;
  /** 없는 보드에서 돌아갈 히스토리가 없을 때 갈 곳(명세 '홈 복귀'). */
  notFoundHref: string;
}

export function DemandBoardDetailView({
  demandBoardId,
  backHref,
  joinHref,
  participationListHref,
  productHrefBase,
  notFoundHref,
}: DemandBoardDetailViewProps) {
  const boardId = toDemandBoardId(demandBoardId);
  const { data: board, error, isPending, refetch, dataUpdatedAt } = useDemandBoard(boardId);
  // 세션이 만료됐으면 오류 화면 대신 로그인으로 보낸다(#159와 같은 처리).
  const isRedirecting = useRedirectOnUnauthorized(error);

  const isNotFound =
    boardId === null ||
    (error instanceof ApiError && error.code === DEMAND_BOARD_ERROR_CODE.NOT_FOUND);

  let body;
  if (isNotFound) {
    body = (
      <ErrorScreen description={[]} title={DEMAND_BOARD_DETAIL.notFound}>
        <GoBackButton className={ERROR_ACTION_CLASS} fallbackHref={notFoundHref}>
          {ERROR_SCREEN_RETRY_LABEL}
        </GoBackButton>
      </ErrorScreen>
    );
  } else if (isPending || isRedirecting) {
    body = (
      <div aria-busy className="flex flex-col gap-4 p-4">
        <Skeleton className="rounded-12 h-28 w-full" />
        <Skeleton className="rounded-12 h-36 w-full" />
      </div>
    );
  } else if (error !== null) {
    body = <ErrorState onRetry={() => void refetch()} retryLabel={ERROR_SCREEN_RETRY_LABEL} />;
  } else {
    const isClosed = isDemandBoardClosed(board.saleEndAt, dataUpdatedAt);
    const remaining =
      board.saleEndAt === undefined ? null : remainingUntil(board.saleEndAt, dataUpdatedAt);

    body = (
      <>
        {/* 하단 고정 버튼에 가리지 않도록 그 높이(80)만큼 비운다. */}
        <div className="flex w-full flex-1 flex-col gap-4 p-4 pb-[calc(80px+env(safe-area-inset-bottom))]">
          {/* 상품 요약. 도감 상세(B-08)로 간다(명세 '도감 상세 링크 → B-08'). */}
          <Link
            className="bg-background-default rounded-12 flex w-full items-center gap-3 p-4"
            href={`${productHrefBase}/${encodeURIComponent(board.catalogId)}`}
          >
            <span className="bg-background-subtle rounded-8 relative block size-16 shrink-0 overflow-hidden">
              {isRenderableImageSrc(board.thumbnailUrl) && (
                <Image
                  alt=""
                  className="object-contain"
                  fill
                  sizes="64px"
                  src={board.thumbnailUrl}
                />
              )}
            </span>
            <span className="text-label-16 text-content-primary min-w-0 flex-1 truncate">
              {board.catalogName}
            </span>
            <ChevronRight aria-hidden className="text-content-tertiary size-5 shrink-0" />
          </Link>

          <div className="bg-background-default rounded-12 flex w-full flex-col gap-3 p-4">
            <dl className="flex w-full flex-col gap-3">
              <InfoRow label={DEMAND_BOARD_DETAIL.participantsLabel}>
                {DEMAND_BOARD_DETAIL.participants(board.participantCount)}
              </InfoRow>
              {board.saleEndAt !== undefined && remaining !== null && (
                <>
                  <InfoRow label={DEMAND_BOARD_DETAIL.remainingLabel}>
                    {remaining.kind === 'minutes'
                      ? DEMAND_BOARD_DETAIL.minutesLeft(remaining.minutes)
                      : `D-${remaining.days}`}
                  </InfoRow>
                  <InfoRow label={DEMAND_BOARD_DETAIL.deadlineAtLabel}>
                    {formatDemandBoardDeadline(board.saleEndAt)}
                  </InfoRow>
                </>
              )}
              {board.desiredPriceLabel !== '' && (
                <InfoRow label={DEMAND_BOARD_DETAIL.priceLabel}>
                  {DEMAND_BOARD_DETAIL.gatheringAt(board.desiredPriceLabel)}
                </InfoRow>
              )}
            </dl>
            {board.sellerCount > 0 && (
              <p className="text-body-14 text-content-brand">
                {DEMAND_BOARD_DETAIL.sellers(board.sellerCount)}
              </p>
            )}
          </div>
        </div>

        {/* 하단 고정 CTA. 명세의 세 상태(참여 가능 / 마감 / 참여 중)를 가른다. 참여 중이 마감보다
            먼저다. 참여한 보드가 마감돼도 볼 곳은 내 대기다. */}
        <div className="max-w-mobile bg-surface-primary fixed inset-x-0 bottom-0 mx-auto w-full p-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
          {board.isParticipating ? (
            <Link
              className={cn(CTA_CLASS, 'bg-surface-button-tertiary-default text-content-inverse')}
              href={participationListHref}
            >
              {DEMAND_BOARD_DETAIL.participating}
            </Link>
          ) : isClosed ? (
            <button
              className={cn(
                CTA_CLASS,
                'bg-surface-disabled-secondary text-content-disabled-secondary',
              )}
              disabled
              type="button"
            >
              {DEMAND_BOARD_DETAIL.closed}
            </button>
          ) : (
            <Link
              className={cn(
                CTA_CLASS,
                'bg-surface-button-primary-default text-content-oncolor active:bg-surface-button-primary-pressed',
              )}
              href={joinHref}
            >
              {DEMAND_BOARD_DETAIL.join}
            </Link>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="bg-surface-primary flex w-full flex-1 flex-col">
      <AppBar backHref={backHref} title={DEMAND_BOARD_DETAIL.appBarTitle} />
      {body}
    </div>
  );
}

/** 라벨 왼쪽, 값 오른쪽 한 줄. */
function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-body-14 text-content-tertiary shrink-0">{label}</dt>
      <dd className="text-label-16 text-content-primary text-right">{children}</dd>
    </div>
  );
}
