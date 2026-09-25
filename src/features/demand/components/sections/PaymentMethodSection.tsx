import Link from 'next/link';

import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { ERROR_SCREEN_RETRY_LABEL } from '@/constants/commonMessages';
import { DEMAND_FORM_MESSAGES, DEMAND_FORM_SECTIONS } from '@/constants/demandFormMessages';
import { PAYMENT_METHOD_MESSAGES } from '@/constants/paymentMethodMessages';
import { DemandFormSection } from '@/features/demand/components/DemandFormSection';
import { PaymentMethodCard } from '@/features/user/components/PaymentMethodCard';
import type { PaymentMethod } from '@/types/payment';

// B-09 결제수단 섹션. 이번 수요에 쓸 결제수단 하나를 보여 준다(FN-B09-02).
//
// 2026-09-23 결제 범위 조정으로 결제 방식 선택(간편결제·카드결제·계좌결제·휴대폰 결제, 사업자 로고
// 3칸)과 토스 프로모션 배너를 뺐다. 결제수단 등록(토스 SDK)이 범위에서 빠져 고른 방식으로 결제할
// 방법이 없고, 백엔드는 등록된 결제수단의 id(`payMethodId`)만 받는다.
//
// ⚠️ 이 상태의 시안은 없다. 새로 그리지 않고 있는 것을 재사용한다.
//    · 결제수단 카드: B-14 목록의 `PaymentMethodCard`(배송지 섹션이 B-30 `AddressCard`를 쓰는 것과 같다)
//    · 미등록 배너 문구: 기능명세 FN-B09-02
//    · 조회 실패 문구: 기능명세 FN-B14-01(같은 조회의 실패 문구)
//    · 등록 버튼 모양: 배송지 섹션의 '신규 배송지 추가' 행
//
// 결제수단을 고르는 규칙과 조회는 `DemandFormView`가 한다. 제출 가능 여부가 같은 값에 걸려 있어서다.
// 이 섹션은 받은 대로 그리기만 한다.

/** 배송지 섹션의 '신규 배송지 추가' 행과 같은 모양(`AddressSection` ADD_ROW_CLASS). */
const REGISTER_ROW_CLASS =
  'bg-surface-secondary rounded-8 text-label-14 text-content-tertiary flex h-11.5 w-full items-center justify-center';

interface PaymentMethodSectionProps {
  /** 이번 수요에 쓸 결제수단. 쓸 수 있는 것이 없으면 null. */
  method: PaymentMethod | null;
  /** 첫 조회 중. */
  isLoading: boolean;
  /** 조회 실패. 쓸 결제수단을 모르므로 제출도 잠긴다. */
  hasError: boolean;
  onRetry: () => void;
  /** 결제수단 관리(B-14) 경로. 라우트는 호출부가 정한다. */
  registerHref: string;
}

export function PaymentMethodSection({
  method,
  isLoading,
  hasError,
  onRetry,
  registerHref,
}: PaymentMethodSectionProps) {
  return (
    <DemandFormSection
      note={DEMAND_FORM_MESSAGES.autoPaymentNote}
      title={DEMAND_FORM_SECTIONS.payment.title}
      titleId={DEMAND_FORM_SECTIONS.payment.id}
    >
      {hasError ? (
        <ErrorState
          className="py-4"
          message={PAYMENT_METHOD_MESSAGES.loadFailed}
          onRetry={onRetry}
          retryLabel={ERROR_SCREEN_RETRY_LABEL}
        />
      ) : isLoading ? (
        // 카드가 들어올 자리만 잡는다. 높이는 PaymentMethodCard와 같다(위아래 여백 14 + 썸네일 38).
        <Skeleton className="rounded-12 h-16.5 w-full" />
      ) : method === null ? (
        // 미등록(FN-B09-02). 등록은 이번 범위에서 빠져 B-14에서도 '준비 중'이지만, 명세의 진입점은
        // 남긴다. B-14의 뒤로 가기는 히스토리를 먼저 쓰므로 이 화면으로 돌아온다(`AppBar`).
        <div className="flex w-full flex-col gap-3">
          <p className="text-body-14 text-content-secondary">
            {DEMAND_FORM_MESSAGES.paymentMissing}
          </p>
          <Link className={REGISTER_ROW_CLASS} href={registerHref}>
            {DEMAND_FORM_MESSAGES.registerPaymentMethod}
          </Link>
        </div>
      ) : (
        <ul className="flex w-full flex-col">
          <PaymentMethodCard method={method} variant="view" />
        </ul>
      )}
    </DemandFormSection>
  );
}
