'use client';

import { useState } from 'react';

import { AppBar } from '@/components/layout/AppBar';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { ORDER_QUANTITY_DEFAULT, PRICE_BANDS, type PriceBandKey } from '@/constants/businessRules';
import { DEMAND_FORM_CONSENTS, DEMAND_FORM_MESSAGES } from '@/constants/demandFormMessages';
import { AddressSection } from '@/features/demand/components/sections/AddressSection';
import { ConsentSection } from '@/features/demand/components/sections/ConsentSection';
import { PaymentMethodSection } from '@/features/demand/components/sections/PaymentMethodSection';
import { PriceBandSection } from '@/features/demand/components/sections/PriceBandSection';
import { ProductSummarySection } from '@/features/demand/components/sections/ProductSummarySection';
import { SubstituteSection } from '@/features/demand/components/sections/SubstituteSection';
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
  product: ProductDetail;
  /** 앱바 뒤로가기가 갈 곳. 라우트는 호출부(page)가 정한다. */
  backHref: string;
}

export function DemandFormView({ product, backHref }: DemandFormViewProps) {
  const [values, setValues] = useState<DemandFormValues>(EMPTY_VALUES);
  const { showToast } = useToast();
  const market = resolveMarketBand(product.listPrice);

  /** 값 하나만 갈아 끼운다. 섹션마다 setter를 따로 만들지 않기 위한 것이다. */
  function update<Key extends keyof DemandFormValues>(key: Key, value: DemandFormValues[Key]) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  // 필수 약관 전부 + 희망 가격대가 정해져야 참여할 수 있다. 시안에서도 그 전까지 버튼이 회색이다.
  //
  // 가격대를 조건에 넣는 이유: 백엔드 등록 바디가 `desiredPriceMin`/`Max`를 필수로 받고
  // (`toDemandCreateRequest`도 구간 미선택이면 던진다), 가격대 없는 수요는 성립하지 않는다. 버튼
  // 활성 조건과 매핑의 전제를 일치시켜, 배선 후 가격대 없이 눌러 예외가 나는 일을 막는다.
  //
  // ⚠️ 결제수단 선택까지 조건에 넣을지는 별도 UX 결정 대상이다(payMethodId는 폼 선택이 아니라
  //    결제수단 조회 API에서 온다). 규격이 나오면 이 식에 더한다.
  const canSubmit =
    values.priceBand !== null && DEMAND_FORM_CONSENTS.every(({ key }) => values.consents[key]);

  /**
   * 수요 등록 제출(#112).
   *
   * 등록 API와 매핑은 `lib/demandApi`에 준비돼 있다(`createDemand`·`toDemandCreateRequest`). 그러나
   * 필수값 `payMethodId`를 얻을 결제수단(토스 브랜드페이) 조회 API가 백엔드에 아직 없어, 지금은
   * 실제 POST를 붙일 수 없다. 결제수단 조회 API가 생기면 이 자리에서 결제수단 id와 카탈로그 id를
   * 받아 아래로 연결한다 —
   *
   *   const request = toDemandCreateRequest(values, { catalogId, payMethodId });
   *   const demandId = await createDemand(request); // 409(DEMAND_001)·404(PAY_001) 분기
   *
   * 그 전까지는 조용히 실패하거나 성공한 척하지 않고 준비중임을 명시한다.
   *
   * 버튼을 비활성으로 잠그지 않고 활성 상태에서 탭 시 안내하는 것은 이 저장소의 규칙이다 —
   * 기능정의서 머리말 "미구현 기능 진입점은 노출하되 탭 시 토스트"(`ComingSoonButton`과 같은 방침).
   * 문구는 일반 '준비 중' 대신, 기능은 있으나 결제 연동만 대기 중임을 밝히는 전용 문구를 쓴다.
   */
  function handleSubmit() {
    showToast(DEMAND_FORM_MESSAGES.submitPending);
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
          B-08 하단 CTA(`ProductDetailView`)에 맞췄다. */}
      <div className="max-w-mobile bg-surface-primary fixed inset-x-0 bottom-0 mx-auto w-full p-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
        <Button
          className="bg-surface-button-primary-default text-content-oncolor text-button-15 active:bg-surface-button-primary-pressed disabled:bg-surface-disabled-secondary disabled:text-content-disabled-secondary rounded-8 h-12 w-full"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {DEMAND_FORM_MESSAGES.submit}
        </Button>
      </div>
    </div>
  );
}
