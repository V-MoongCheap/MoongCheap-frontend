'use client';

import { Radio, RadioGroup } from '@/components/ui/Radio';
import { PRICE_BANDS, type PriceBandKey } from '@/constants/businessRules';
import { DEMAND_FORM_SECTIONS } from '@/constants/demandFormMessages';
import { DemandFormSection } from '@/features/demand/components/DemandFormSection';

// B-09 희망가격 섹션. 시안 `1153:71254` · `1153:71594`(시장평균가 초과).
//
// 선택지는 `PRICE_BANDS`(FN-B09-01)가 단일 출처다. 라벨까지 거기서 가져온다 — 같은 시안 안에서
// 표기가 갈리는데(라디오 `5천원대 이하` vs 제품 카드 `3만원 이하`), 명세의 가격 매핑표와 뜻이
// 맞는 쪽으로 통일했다([[constants/demandFormMessages]]).
//
// 시장평균가보다 높은 구간을 고르면 그 줄이 붉게 바뀌고 토스트가 뜬다. **막지는 않는다** — 시안에
// 버튼이 잠기거나 선택이 되돌아가는 표현이 없고, 더 비싸게 사겠다는 것 자체는 막을 이유가 없다.

interface PriceBandSectionProps {
  priceBand: PriceBandKey | null;
  /**
   * 시장평균가를 넘는 구간의 key 목록.
   *
   * 판정 자체는 이 컴포넌트가 하지 않는다. 시장평균가가 상품마다 다르고 아직 서버에서 내려오는
   * 값이 아니라, 어디까지가 초과인지는 위(제품 정보를 아는 쪽)가 정한다.
   */
  overMarketBands: readonly PriceBandKey[];
  onPriceBandChange: (priceBand: PriceBandKey) => void;
}

export function PriceBandSection({
  priceBand,
  overMarketBands,
  onPriceBandChange,
}: PriceBandSectionProps) {
  return (
    <DemandFormSection
      title={DEMAND_FORM_SECTIONS.price.title}
      titleId={DEMAND_FORM_SECTIONS.price.id}
    >
      <RadioGroup labelledBy={DEMAND_FORM_SECTIONS.price.id} name="demand-price-band">
        {PRICE_BANDS.map((band) => {
          // 고른 줄만 붉어진다. 고르기 전에는 초과 구간도 보통 색이다(시안 `1153:71594`).
          const isOverMarket = priceBand === band.key && overMarketBands.includes(band.key);

          return (
            <Radio
              checked={priceBand === band.key}
              className={isOverMarket ? 'text-surface-danger' : undefined}
              dotClassName={isOverMarket ? 'bg-surface-danger' : undefined}
              key={band.key}
              label={band.label}
              name="demand-price-band"
              onChange={() => onPriceBandChange(band.key)}
              value={band.key}
            />
          );
        })}
      </RadioGroup>
    </DemandFormSection>
  );
}
