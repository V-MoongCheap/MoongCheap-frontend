import { ComingSoonButton } from '@/components/ui/ComingSoonButton';
import { HOME_DEMAND_MORE_BUTTON, HOME_SECTIONS } from '@/constants/homeMessages';
import { ROUTES } from '@/constants/routes';
import { HorizontalScroller } from '@/features/home/components/HorizontalScroller';
import { ProductCard } from '@/features/home/components/ProductCard';
import { SectionHeader } from '@/features/home/components/SectionHeader';
import type { HomeProductCard } from '@/types/home';

// card-list-1. 시안 `981:18260`. 가로 카드 목록 + 아래 전체 폭 버튼.
//
// 이 섹션만 목록 아래에 전체 폭 버튼이 하나 더 붙는다. 행선지가 미정이라 '준비 중' 토스트다.

interface DemandSectionProps {
  products: readonly HomeProductCard[];
}

export function DemandSection({ products }: DemandSectionProps) {
  return (
    <section className="flex w-full flex-col gap-6">
      <div className="flex w-full flex-col gap-3">
        <SectionHeader title={HOME_SECTIONS.demand.title} />
        <HorizontalScroller className="gap-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} href={ROUTES.product(product.id)} />
          ))}
        </HorizontalScroller>
      </div>

      <div className="flex w-full flex-col px-4">
        <ComingSoonButton className="bg-surface-button-quarternary-default border-border-button-quarternary rounded-8 text-button-14 text-content-primary flex h-11 w-full max-w-[361px] items-center justify-center border px-3">
          {HOME_DEMAND_MORE_BUTTON}
        </ComingSoonButton>
      </div>
    </section>
  );
}
