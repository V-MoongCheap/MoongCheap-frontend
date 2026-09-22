'use client';

import { useState } from 'react';

import Image from 'next/image';

import { AlertDialog } from '@/components/ui/AlertDialog';
import { useToast } from '@/components/ui/Toast';
import { AWARD_RESULT_ASSETS } from '@/constants/assets';
import { CANCEL_AWARD_DIALOG } from '@/constants/awardCancel';
import { formatWon } from '@/lib/formatPrice';
import type { AwardResult } from '@/types/awardResult';

// B-19 낙찰 성공 정보. 낙찰 결과(축하 일러스트 + 상품·금액 요약) + 하단 CTA로 구성한다.
//
// 이 화면은 "48시간 내 자동결제 대기" 상태(참여 배정완료 ALLOCATED)의 상세라, 하단 CTA가
// '뭉치 낙찰 취소하기'다(자동결제 전까지 취소 가능). 취소 흐름은 B-17 목록과 같은 확인 다이얼로그를
// 공유한다(constants/awardCancel.ts). 실제 취소·상태 전이 배선은 BE 규격 확정 시.
//
// 상단 문구("낙찰 되었어요!"·"48시간 후 …")는 화면 카피라 상수로 둔다. 48시간이 데이터로 내려오게
// 되면 이 문구를 값으로 바꾼다.
const HEADLINE = '낙찰 되었어요!';
const SUBHEAD = '48시간 후 등록된 결제수단으로 자동결제돼요.';

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

interface AwardResultViewProps {
  result: AwardResult;
}

export function AwardResultView({ result }: AwardResultViewProps) {
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const { showToast } = useToast();

  // 낙찰 취소 확정(mock). 실제 서버 취소·화면 이탈은 BE 연동 시. 지금은 안내 토스트만 띄운다.
  function handleConfirmCancel() {
    setIsCancelOpen(false);
    showToast(CANCEL_AWARD_DIALOG.successToast);
  }

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
        <p className="text-body-14 text-content-quarternary mt-1 text-center">{SUBHEAD}</p>

        {/* 상품 카드. 원본 썸네일 미연동이라 회색 placeholder(참여 카드와 같은 규칙). */}
        <div className="bg-surface-secondary rounded-16 mt-8 flex items-center gap-3 p-3">
          <div aria-hidden className="bg-surface-tertiary rounded-12 size-14 shrink-0" />
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="text-body-15 text-content-primary truncate font-semibold">
              {result.productName}
            </p>
            <p className="text-caption-12 text-content-quarternary truncate">{result.category}</p>
          </div>
        </div>

        {/* 금액·낙찰 요약. 시안대로 두 개의 구분선으로 3개 블록으로 나눈다. */}
        <div className="mt-6 flex flex-col gap-3">
          <SummaryRow emphasized label="최종 낙찰가" value={formatWon(result.finalBidPrice)} />
          <SummaryRow label="희망가" value={result.desiredPriceLabel} />
          <SummaryRow label="내 참여 수량" value={`${result.myQuantity}개`} />
        </div>

        <div className="border-divider-default my-4 border-t" />

        <div className="flex flex-col gap-3">
          <SummaryRow label="셀러명" value={result.sellerName} />
          <SummaryRow label="낙찰 날짜" value={result.awardedAt} />
          <SummaryRow label="최종 응찰" value={`${result.finalBidCount}건`} />
          <SummaryRow
            label="참여 뭉치단"
            value={`${result.participantGroupCount.toLocaleString('ko-KR')}명`}
          />
        </div>

        <div className="border-divider-default my-4 border-t" />

        <div className="flex items-center justify-between gap-3">
          <span className="text-heading-18 text-content-primary">결제 예정 금액</span>
          <span className="text-heading-18 text-content-brand">
            {formatWon(result.expectedPaymentPrice)}
          </span>
        </div>
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
