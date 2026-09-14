import Image from 'next/image';

import { DEMAND_FORM_MESSAGES, DEMAND_FORM_SECTIONS } from '@/constants/demandFormMessages';
import { DemandFormSection } from '@/features/demand/components/DemandFormSection';
import { QuantityStepper } from '@/features/demand/components/QuantityStepper';
import { isRenderableImageSrc } from '@/lib/imageSource';
import type { ProductDetail } from '@/types/product';

// B-09 제품 상세 섹션. 시안 컴포넌트 `product-summary-card`(`I1153:71245`).
//
// 실측: 카드 361x162 · 안쪽 여백 16 · 썸네일 90x90 radius 8 `background/subtle` ·
//       썸네일과 글 사이 8 · 수량 행 24 · 스테퍼 90x24.
//
// ⚠️ 오른쪽 값의 레이어 이름은 `희망 가격대`인데 그려진 글자는 `시장평균가`다. 사용자가 아래에서
//    고르는 희망가격과 **다른 값**이며, 이 카드는 고른 값을 되비추지 않는다.
//
// ⚠️ 시장평균가에 해당하는 서버 필드가 없다. 지금은 정가(`listPrice`)가 속한 가격 구간을 그대로
//    쓴다. 실제 평균가가 내려오면 그 값으로 구간을 다시 고른다.

interface ProductSummarySectionProps {
  product: ProductDetail;
  /** 시장평균가가 속한 구간의 라벨. 구간 계산은 위(`DemandFormView`)가 한다. */
  marketPriceLabel: string;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}

export function ProductSummarySection({
  product,
  marketPriceLabel,
  quantity,
  onQuantityChange,
}: ProductSummarySectionProps) {
  return (
    <DemandFormSection
      note={DEMAND_FORM_MESSAGES.auctionWaitNote}
      title={DEMAND_FORM_SECTIONS.product.title}
      titleId={DEMAND_FORM_SECTIONS.product.id}
    >
      <div className="flex w-full gap-2">
        {/* 썸네일. 외부 절대 URL은 next/image가 렌더에서 던지므로 `isRenderableImageSrc`로 걸러 낸다. */}
        <span className="bg-background-subtle rounded-8 relative block size-22.5 shrink-0 overflow-hidden">
          {isRenderableImageSrc(product.thumbnailUrl) && (
            <Image alt="" className="object-contain" fill sizes="90px" src={product.thumbnailUrl} />
          )}
        </span>

        <div className="flex min-w-0 flex-1 flex-col">
          <p className="text-caption-10 text-content-secondary truncate">{product.brandName}</p>
          <p className="text-label-16 text-content-primary truncate">{product.name}</p>
          <p className="text-caption-10 text-content-quarternary truncate">{product.spec}</p>

          {/* 시안: 오른쪽 정렬. 라벨이 위, 값이 아래. */}
          <div className="mt-2 flex flex-col items-end">
            <p className="text-caption-10 text-content-tertiary">
              {DEMAND_FORM_MESSAGES.marketPrice}
            </p>
            <p className="text-label-16 text-content-primary">{marketPriceLabel}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex w-full items-center justify-between">
        <p className="text-label-16 text-content-primary flex items-center gap-2">
          {DEMAND_FORM_MESSAGES.quantity}
          <span>{DEMAND_FORM_MESSAGES.quantityUnit(quantity)}</span>
        </p>
        <QuantityStepper label={product.name} onChange={onQuantityChange} value={quantity} />
      </div>
    </DemandFormSection>
  );
}
