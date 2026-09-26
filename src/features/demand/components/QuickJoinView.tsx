'use client';

import { useRef, useState } from 'react';

import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { AppBar } from '@/components/layout/AppBar';
import { Button } from '@/components/ui/Button';
import { ERROR_ACTION_CLASS, ErrorScreen } from '@/components/ui/ErrorScreen';
import { ErrorState } from '@/components/ui/ErrorState';
import { GoBackButton } from '@/components/ui/GoBackButton';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { ORDER_QUANTITY_DEFAULT } from '@/constants/businessRules';
import { ERROR_SCREEN_RETRY_LABEL } from '@/constants/commonMessages';
import {
  DEMAND_BOARD_DETAIL,
  QUICK_JOIN,
  QUICK_JOIN_SECTION_ID,
} from '@/constants/demandBoardMessages';
import { DEMAND_FORM_CONSENTS } from '@/constants/demandFormMessages';
import { useRedirectOnUnauthorized } from '@/features/auth/session';
import { DemandFormSection } from '@/features/demand/components/DemandFormSection';
import { QuantityStepper } from '@/features/demand/components/QuantityStepper';
import { ConsentSection } from '@/features/demand/components/sections/ConsentSection';
import { PaymentMethodSection } from '@/features/demand/components/sections/PaymentMethodSection';
import { SubstituteSection } from '@/features/demand/components/sections/SubstituteSection';
import { useDemandBoard, useJoinDemandBoard } from '@/features/demand/hooks/useDemandBoard';
import {
  pickPaymentMethodForDemand,
  usePaymentMethods,
} from '@/features/user/hooks/usePaymentMethods';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';
import {
  DEMAND_BOARD_ERROR_CODE,
  formatDemandBoardDeadline,
  isDemandBoardClosed,
  type QuickJoinValues,
  toDemandBoardId,
} from '@/lib/demandBoardApi';
import { isRenderableImageSrc } from '@/lib/imageSource';

// 퀵 참여(FN-B12-02). 수요 상세 [함께 신청하기] → 뭉치 진행 과정 안내 → [확인] → 이 화면.
//
// 명세는 수요 상세 위에 뜨는 바텀시트지만, 참여 직전에 진행 과정 안내 화면을 거치는 흐름
// (`DemandGuideView` 주석, B-08 → B-09와 같은 구조)이라 별도 화면으로 만들었다. 입력 항목은 명세 그대로다.
//
//   참여 조건(상품명 · 희망 가격대 · 마감일, 변경 불가) + 수량 스테퍼
//   결제수단(수요 등록과 같은 섹션, 9/23 결제 범위 조정: 기본 결제수단 1개 표시)
//   대체 상품 동의 · 약관 동의(수요 등록과 같은 섹션)
//
// 결제수단은 수요 등록과 같은 규칙으로 고른다(`pickPaymentMethodForDemand`). QA #153이 요청한
// '수요 참여 시 조회한 기본 결제수단 ID 사용'이 이 화면이다.

const EMPTY_VALUES: QuickJoinValues = {
  quantity: ORDER_QUANTITY_DEFAULT,
  substituteAgreed: null,
  substituteNote: '',
  consents: {
    autoPayment: false,
    privacyCollection: false,
    privacyThirdParty: false,
    pgTerms: false,
  },
};

/** 하단 버튼. 수요 등록 화면 하단 버튼과 같은 모양이다. */
const SUBMIT_CLASS =
  'text-button-15 rounded-8 flex h-12 w-full items-center justify-center gap-2 bg-surface-button-primary-default text-content-oncolor active:bg-surface-button-primary-pressed disabled:bg-surface-disabled-secondary disabled:text-content-disabled-secondary';

interface QuickJoinViewProps {
  /** 라우트의 수요보드 id. */
  demandBoardId: string;
  /** 수요 상세 경로. 앱바 뒤로가기 대체 경로이자, 마감·없는 보드일 때 돌려보낼 곳이다. */
  detailHref: string;
  /** 참여 후 이동할 내 대기(B-17). */
  participationListHref: string;
  /** 결제수단이 없을 때 보내는 결제수단 관리(B-14). */
  paymentMethodsHref: string;
  /** 없는 보드에서 돌아갈 히스토리가 없을 때 갈 곳. */
  notFoundHref: string;
}

export function QuickJoinView({
  demandBoardId,
  detailHref,
  participationListHref,
  paymentMethodsHref,
  notFoundHref,
}: QuickJoinViewProps) {
  const boardId = toDemandBoardId(demandBoardId);
  const boardQuery = useDemandBoard(boardId);
  const isRedirecting = useRedirectOnUnauthorized(boardQuery.error);
  const paymentMethods = usePaymentMethods();
  const payMethod =
    paymentMethods.methods === null ? null : pickPaymentMethodForDemand(paymentMethods.methods);
  const [values, setValues] = useState<QuickJoinValues>(EMPTY_VALUES);
  const { showToast } = useToast();
  const router = useRouter();
  const joinDemandBoard = useJoinDemandBoard();
  // 중복 제출 가드. 수요 등록(`DemandFormView`)과 같은 이유로 ref를 쓴다.
  const submittingRef = useRef(false);

  function update<Key extends keyof QuickJoinValues>(key: Key, value: QuickJoinValues[Key]) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  const board = boardQuery.data;
  const isNotFound =
    boardId === null ||
    (boardQuery.error instanceof ApiError &&
      boardQuery.error.code === DEMAND_BOARD_ERROR_CODE.NOT_FOUND);
  const isClosed =
    board !== undefined && isDemandBoardClosed(board.saleEndAt, boardQuery.dataUpdatedAt);

  // 참여 확정 활성 조건(명세 화면 상태 '동의 미체크 → 참여 확정 비활성, 미등록자는 배너 + 비활성 유지').
  // 대체 상품 동의는 선택 항목이라 조건에 넣지 않는다.
  const canSubmit =
    boardId !== null &&
    board !== undefined &&
    !board.isParticipating &&
    !isClosed &&
    payMethod !== null &&
    DEMAND_FORM_CONSENTS.every(({ key }) => values.consents[key]);
  const isSubmitting = joinDemandBoard.isPending;

  /**
   * 참여 확정 제출. 성공·이미 참여 중이면 내 대기(B-17)로 replace한다. 뒤로 가기로 이미 제출한
   * 화면에 돌아와 다시 누르는 일을 막는다(수요 등록과 같은 이유).
   *
   * 실패 안내는 명세 문구가 있는 것(마감)만 명세대로, 나머지는 백엔드 메시지를 그대로 쓴다.
   */
  function handleSubmit() {
    if (!canSubmit || submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    joinDemandBoard.mutate(
      { demandBoardId: boardId, payMethodId: payMethod.id, values },
      {
        onSuccess: () => {
          showToast(QUICK_JOIN.submitSuccess);
          router.replace(participationListHref);
        },
        onError: (error) => {
          submittingRef.current = false;
          const code = error instanceof ApiError ? error.code : undefined;

          // 제출 사이에 마감됐다. 상세로 돌려보내 마감 상태를 보여 준다(명세 '화면을 마감 상태로 갱신').
          // 명세의 '새로 공구를 신청할까요?' 전환(B-09로 수량 유지)은 이번 범위에서 뺐다.
          if (code === DEMAND_BOARD_ERROR_CODE.CLOSED) {
            showToast(QUICK_JOIN.closedJustNow);
            void boardQuery.refetch();
            router.replace(detailHref);
            return;
          }

          showToast(error.message);
          // 같은 상품에 진행 중인 수요가 이미 있다(명세 '같은 상품의 다른 수요보드에 참여 중 → 안내 후
          // B-17 이동').
          if (code === DEMAND_BOARD_ERROR_CODE.ALREADY_EXISTS) {
            router.replace(participationListHref);
          }
          // 보여 준 결제수단이 그사이 삭제·비활성됐다. 목록을 다시 받아 섹션과 제출 조건을 맞춘다.
          if (code === DEMAND_BOARD_ERROR_CODE.PAY_METHOD_NOT_FOUND) {
            paymentMethods.refetch();
          }
          // 보드가 사라졌다. 상세에서 '종료된 공구예요'를 보여 준다.
          if (code === DEMAND_BOARD_ERROR_CODE.NOT_FOUND) {
            router.replace(detailHref);
          }
        },
      },
    );
  }

  let body;
  if (isNotFound) {
    body = (
      <ErrorScreen description={[]} title={DEMAND_BOARD_DETAIL.notFound}>
        <GoBackButton className={ERROR_ACTION_CLASS} fallbackHref={notFoundHref}>
          {ERROR_SCREEN_RETRY_LABEL}
        </GoBackButton>
      </ErrorScreen>
    );
  } else if (boardQuery.isPending || isRedirecting) {
    body = (
      <div aria-busy className="flex flex-col gap-4 p-4">
        <Skeleton className="rounded-12 h-40 w-full" />
        <Skeleton className="rounded-12 h-24 w-full" />
      </div>
    );
  } else if (boardQuery.error !== null) {
    body = (
      <ErrorState onRetry={() => void boardQuery.refetch()} retryLabel={ERROR_SCREEN_RETRY_LABEL} />
    );
  } else {
    const current = boardQuery.data;

    body = (
      <>
        {/* 하단 고정 버튼에 가리지 않도록 그 높이(80)만큼 비운다. */}
        <div className="flex w-full flex-1 flex-col gap-6 py-4 pb-[calc(80px+env(safe-area-inset-bottom))]">
          <DemandFormSection
            note={QUICK_JOIN.conditionNote}
            title={QUICK_JOIN.conditionTitle}
            titleId={QUICK_JOIN_SECTION_ID}
          >
            <div className="flex w-full gap-3">
              <span className="bg-background-subtle rounded-8 relative block size-16 shrink-0 overflow-hidden">
                {isRenderableImageSrc(current.thumbnailUrl) && (
                  <Image
                    alt=""
                    className="object-contain"
                    fill
                    sizes="64px"
                    src={current.thumbnailUrl}
                  />
                )}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="text-label-16 text-content-primary truncate">{current.catalogName}</p>
                <dl className="flex flex-col gap-1">
                  {current.desiredPriceLabel !== '' && (
                    <div className="flex gap-2">
                      <dt className="text-body-14 text-content-tertiary">
                        {DEMAND_BOARD_DETAIL.priceLabel}
                      </dt>
                      <dd className="text-body-14 text-content-primary">
                        {current.desiredPriceLabel}
                      </dd>
                    </div>
                  )}
                  {current.saleEndAt !== undefined && (
                    <div className="flex gap-2">
                      <dt className="text-body-14 text-content-tertiary">
                        {QUICK_JOIN.deadlineLabel}
                      </dt>
                      <dd className="text-body-14 text-content-primary">
                        {formatDemandBoardDeadline(current.saleEndAt)}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            <div className="border-border-subtle mt-4 flex items-center justify-between border-t pt-4">
              <span className="text-body-14 text-content-tertiary">{QUICK_JOIN.quantityLabel}</span>
              <QuantityStepper
                label={current.catalogName}
                onChange={(quantity) => update('quantity', quantity)}
                value={values.quantity}
              />
            </div>
          </DemandFormSection>

          <PaymentMethodSection
            hasError={paymentMethods.error !== null}
            isLoading={paymentMethods.isLoading}
            method={payMethod}
            onRetry={paymentMethods.refetch}
            registerHref={paymentMethodsHref}
          />

          <SubstituteSection
            agreed={values.substituteAgreed}
            note={values.substituteNote}
            onAgreedChange={(agreed) => update('substituteAgreed', agreed)}
            onNoteChange={(note) => update('substituteNote', note)}
          />

          <ConsentSection
            consents={values.consents}
            onConsentsChange={(consents) => update('consents', consents)}
          />
        </div>

        {/* 하단 고정. 이미 참여 중이면 내 대기로, 마감이면 잠긴 버튼으로 바꾼다(명세 화면 상태
            '비활성: 마감', '미노출: 참여 중'). 제출 중에는 잠그고 스피너를 붙인다. */}
        <div className="max-w-mobile bg-surface-primary fixed inset-x-0 bottom-0 mx-auto w-full p-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
          {current.isParticipating ? (
            <Link
              className={cn(
                SUBMIT_CLASS,
                'bg-surface-button-tertiary-default text-content-inverse',
              )}
              href={participationListHref}
            >
              {DEMAND_BOARD_DETAIL.participating}
            </Link>
          ) : (
            <Button
              aria-busy={isSubmitting}
              className={SUBMIT_CLASS}
              disabled={!canSubmit || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting && <Loader2 aria-hidden className="size-5 animate-spin" />}
              {isClosed ? DEMAND_BOARD_DETAIL.closed : QUICK_JOIN.submit}
            </Button>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="bg-surface-primary flex w-full flex-1 flex-col">
      <AppBar backHref={detailHref} title={QUICK_JOIN.appBarTitle} />
      {body}
    </div>
  );
}
