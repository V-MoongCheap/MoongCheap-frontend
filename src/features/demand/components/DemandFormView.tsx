'use client';

import { useRef, useState } from 'react';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { AppBar } from '@/components/layout/AppBar';
import { Button } from '@/components/ui/Button';
import { NotFoundScreen } from '@/components/ui/NotFoundScreen';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { ORDER_QUANTITY_DEFAULT, PRICE_BANDS, type PriceBandKey } from '@/constants/businessRules';
import { DEMAND_FORM_CONSENTS, DEMAND_FORM_MESSAGES } from '@/constants/demandFormMessages';
import { AddressSection } from '@/features/demand/components/sections/AddressSection';
import { ConsentSection } from '@/features/demand/components/sections/ConsentSection';
import { PaymentMethodSection } from '@/features/demand/components/sections/PaymentMethodSection';
import { PriceBandSection } from '@/features/demand/components/sections/PriceBandSection';
import { ProductSummarySection } from '@/features/demand/components/sections/ProductSummarySection';
import { SubstituteSection } from '@/features/demand/components/sections/SubstituteSection';
import { useCreateDemand } from '@/features/demand/hooks/useCreateDemand';
import { useProductCatalogOverlay } from '@/features/product/hooks/useProductCatalogOverlay';
import { ApiError } from '@/lib/api';
import { DEMAND_ERROR_CODE, TEMPORARY_PAY_METHOD_ID, toDemandCreateRequest } from '@/lib/demandApi';
import { toCatalogId } from '@/lib/productApi';
import type { DemandFormValues } from '@/types/demandForm';
import type { ProductDetail } from '@/types/product';

// B-09 수요 등록/참여 폼의 껍데기. 시안 `1153:71238`.
//
// **이 파일은 조립만 한다.** 섹션 내용은 각자 `sections/` 아래 자기 파일에서 만든다. 두 사람이
// 나눠 작업하기 때문에, 값을 여기 한 곳에 모아 두고 섹션은 자기 값과 onChange만 받게 했다.
// 그래야 각자 자기 파일만 건드리고 이 파일은 손대지 않는다.
//
// 실측: 섹션 사이 24 · 좌우 여백 16 · 하단 버튼 영역 80(버튼 361x48, 위아래 여백 16).

/** 아직 아무것도 고르지 않은 상태. */
const EMPTY_VALUES: DemandFormValues = {
  quantity: ORDER_QUANTITY_DEFAULT,
  addressId: null,
  priceBand: null,
  paymentMethod: null,
  easyPayProvider: null,
  substituteAgreed: null,
  substituteNote: '',
  consents: {
    autoPayment: false,
    privacyCollection: false,
    privacyThirdParty: false,
    pgTerms: false,
  },
};

/**
 * 시장평균가가 속한 구간과, 그보다 비싼 구간들.
 *
 * 시장평균가 필드가 서버에 없어서 정가(`listPrice`)로 대신한다. 정가가 없으면 비교할 기준이
 * 없으므로 아무 구간도 초과로 보지 않는다 — 근거 없이 경고를 띄우지 않기 위해서다.
 */
function resolveMarketBand(listPrice: number | undefined) {
  const market = listPrice === undefined ? undefined : PRICE_BANDS.find((b) => listPrice <= b.max);
  if (market === undefined) {
    return { label: '-', overBands: [] as readonly PriceBandKey[] };
  }
  return {
    label: market.label,
    overBands: PRICE_BANDS.filter((b) => b.min > market.max).map((b) => b.key),
  };
}

interface DemandFormViewProps {
  /** 서버에서 그린 mock 상품. 도감 실데이터가 오면 그 위에 덮는다(`useProductCatalogOverlay`). */
  product: ProductDetail;
  /** 앱바 뒤로가기가 갈 곳. 라우트는 호출부(page)가 정한다. */
  backHref: string;
  /** 등록 후 이동할 내 참여 목록(B-17). 라우트는 호출부(page)가 정한다. */
  participationListHref: string;
}

export function DemandFormView({
  product: initialProduct,
  backHref,
  participationListHref,
}: DemandFormViewProps) {
  // 상품 요약을 도감 실데이터로 덮는다. B-08과 같은 조회라 두 화면이 같은 상품을 보여 준다.
  // 서버에서 받은 mock은 모르는 id에 코어맥스 상품을 돌려주므로, 덮지 않으면 다른 상품이 보인다.
  // 없는 상품이면 404를 그리고, 판정 전에는 mock 상품을 그리지 않는다(#151, B-08과 같은 기준).
  const { product, status } = useProductCatalogOverlay(initialProduct);
  const [values, setValues] = useState<DemandFormValues>(EMPTY_VALUES);
  const { showToast } = useToast();
  const router = useRouter();
  const createDemand = useCreateDemand();
  const market = resolveMarketBand(product.listPrice);

  /** 값 하나만 갈아 끼운다. 섹션마다 setter를 따로 만들지 않기 위한 것이다. */
  function update<Key extends keyof DemandFormValues>(key: Key, value: DemandFormValues[Key]) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  // 필수 약관 전부 + 희망 가격대가 정해져야 참여할 수 있다. 시안에서도 그 전까지 버튼이 회색이다.
  //
  // 가격대를 조건에 넣는 이유: 백엔드 등록 바디가 `desiredPriceMin`/`Max`를 필수로 받고
  // (`toDemandCreateRequest`도 구간 미선택이면 던진다), 가격대 없는 수요는 성립하지 않는다. 버튼
  // 활성 조건과 매핑의 전제를 일치시켜, 가격대 없이 눌러 예외가 나는 일을 막는다.
  //
  // 결제수단은 조건에 넣지 않는다. 결제수단 등록 화면(B-14)이 없어 `payMethodId`를
  // `TEMPORARY_PAY_METHOD_ID`로 고정해 보내므로, 화면에서 고르는 값이 요청에 쓰이지 않는다.
  //
  // 상품 id가 백엔드 도감 id로 바뀌지 않으면(홈 목 카드의 `demand-1` 등) 버튼을 잠근다. 보내 봐야
  // `catalogId`가 null로 나가 400이 확정이다. 목 상품이라 안내 문구는 따로 두지 않는다.
  const catalogId = toCatalogId(product.id);
  const canSubmit =
    catalogId !== null &&
    values.priceBand !== null &&
    DEMAND_FORM_CONSENTS.every(({ key }) => values.consents[key]);
  const isSubmitting = createDemand.isPending;
  // 중복 제출 가드. `isPending`은 다음 렌더에서야 true가 되므로, 그 사이의 두 번째 탭은 통과한다.
  // ref는 탭 즉시 바뀌어 같은 틱의 두 번째 호출까지 막는다.
  const submittingRef = useRef(false);

  /**
   * 수요 등록 제출(FN-B09-04, #148). `POST /api/members/me/demand`.
   *
   * 카탈로그 id는 이 화면의 상품 id(라우트 `productId`)를 숫자로 바꾼 값이다(`toCatalogId`).
   * 결제수단 id는 임시로 고정한다(`TEMPORARY_PAY_METHOD_ID` 주석).
   *
   * 성공·중복 모두 내 참여 목록(B-17)으로 replace한다. push로 쌓으면 목록에서 뒤로 가기가 이미
   * 제출한 폼으로 돌아와, 같은 값을 다시 눌러 409를 받게 된다. replace면 상품 상세로 돌아간다.
   *
   * 실패 안내는 백엔드가 준 메시지를 그대로 쓴다. 명세에 실패 문구가 없고, `apiFetch`가 네트워크
   * 오류까지 한국어 메시지를 붙여 올린다. 입력값은 그대로 두어 버튼을 다시 누르면 재시도가 된다.
   */
  function handleSubmit() {
    if (!canSubmit || submittingRef.current) {
      return;
    }

    const request = toDemandCreateRequest(values, {
      catalogId,
      payMethodId: TEMPORARY_PAY_METHOD_ID,
    });

    submittingRef.current = true;
    createDemand.mutate(request, {
      // 성공하면 가드를 풀지 않는다. 목록으로 이동하는 동안 버튼이 다시 눌려 409가 나지 않게 한다.
      onSuccess: () => {
        showToast(DEMAND_FORM_MESSAGES.submitSuccess);
        router.replace(participationListHref);
      },
      onError: (error) => {
        submittingRef.current = false;
        showToast(error.message);
        // 같은 상품에 진행 중인 수요가 이미 있으면 B-17에서 기존 건을 보게 한다
        // (FN-B09-04 예외처리 '이미 접수한 상태 → 안내 후 B-17 이동').
        if (error instanceof ApiError && error.code === DEMAND_ERROR_CODE.ALREADY_EXISTS) {
          router.replace(participationListHref);
        }
      },
    });
  }

  if (status === 'notFound' || status === 'loading') {
    return (
      <div className="max-w-mobile bg-surface-primary mx-auto flex min-h-svh w-full flex-col">
        <AppBar backHref={backHref} title={DEMAND_FORM_MESSAGES.appBarTitle} />
        {status === 'notFound' ? (
          <NotFoundScreen fallbackHref="/" />
        ) : (
          <div aria-busy className="p-4">
            <Skeleton className="h-24 w-full" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-mobile bg-surface-primary mx-auto flex min-h-svh w-full flex-col">
      <AppBar backHref={backHref} title={DEMAND_FORM_MESSAGES.appBarTitle} />

      {/* 하단 고정 버튼에 가리지 않도록 그 높이(80)만큼 비운다. */}
      <div className="flex w-full flex-1 flex-col gap-6 py-4 pb-[calc(80px+env(safe-area-inset-bottom))]">
        <ProductSummarySection
          marketPriceLabel={market.label}
          onQuantityChange={(quantity) => update('quantity', quantity)}
          product={product}
          quantity={values.quantity}
        />

        {/* 시안에 배송지를 고르는 UI가 없어 값을 위로 올리지 않는다. 기본 배송지를 그대로 쓴다. */}
        <AddressSection />

        <PriceBandSection
          onPriceBandChange={(priceBand) => {
            update('priceBand', priceBand);
            // 시장평균가를 넘는 구간을 고르면 알리기만 한다. 선택을 되돌리거나 막지 않는다.
            if (market.overBands.includes(priceBand)) {
              showToast(DEMAND_FORM_MESSAGES.priceOverMarket);
            }
          }}
          overMarketBands={market.overBands}
          priceBand={values.priceBand}
        />

        <PaymentMethodSection
          easyPayProvider={values.easyPayProvider}
          onEasyPayProviderChange={(provider) => update('easyPayProvider', provider)}
          onPaymentMethodChange={(method) => update('paymentMethod', method)}
          paymentMethod={values.paymentMethod}
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

      {/* 시안: 화면 하단 고정. 버튼 361x48 · radius 8 · 좌우·위아래 여백 16.
          필수 동의 전에는 회색으로 잠긴다(바탕 #e6e6e6 · 글자 #767676, 픽셀 직접 확인).
          활성 상태는 어느 시안에도 없다. 제공된 프레임이 전부 잠긴 상태라, 같은 자리·같은 역할인
          B-08 하단 CTA(`ProductDetailView`)에 맞췄다.

          제출 중에는 버튼을 잠그고 스피너를 붙인다(FN-B09-04 화면 상태 '제출 중 버튼 비활성 +
          스피너', 중복 제출 방지). 시안에 제출 중 상태가 없어 문구는 그대로 두고 아이콘만 더한다. */}
      <div className="max-w-mobile bg-surface-primary fixed inset-x-0 bottom-0 mx-auto w-full p-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
        <Button
          aria-busy={isSubmitting}
          className="bg-surface-button-primary-default text-content-oncolor text-button-15 active:bg-surface-button-primary-pressed disabled:bg-surface-disabled-secondary disabled:text-content-disabled-secondary rounded-8 flex h-12 w-full items-center justify-center gap-2"
          disabled={!canSubmit || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting && <Loader2 aria-hidden className="size-5 animate-spin" />}
          {DEMAND_FORM_MESSAGES.submit}
        </Button>
      </div>
    </div>
  );
}
