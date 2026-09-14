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
  consents: { autoPayment: false, privacy: false, pgTerms: false },
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

  // 필수 약관 3개가 모두 켜져야 참여할 수 있다. 시안에서도 그 전까지 버튼이 회색이다.
  //
  // ⚠️ 지금은 약관만 본다. 배송지·희망가격·결제수단까지 골라야 하는지는 기능명세서에 없어서
  //    조건을 임의로 늘리지 않았다. 규격이 나오면 이 식만 고친다.
  const canSubmit = DEMAND_FORM_CONSENTS.every(({ key }) => values.consents[key]);

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
        >
          {DEMAND_FORM_MESSAGES.submit}
        </Button>
      </div>
    </div>
  );
}
