import { ROUTES } from '@/constants/routes';
import { HorizontalScroller } from '@/features/home/components/HorizontalScroller';
import { ProductCard } from '@/features/home/components/ProductCard';
import { SectionHeader } from '@/features/home/components/SectionHeader';
import type { HomeProductCard } from '@/types/home';

// 세로 카드를 가로로 늘어놓는 섹션. card-list-3(관심사 추천) · card-list-4(성사된 공구)가
// 같은 껍데기를 쓴다. 시안 `981:18283`·`981:18291`.
//
// card-list-1(수요)만 아래에 버튼이 하나 더 붙어 DemandSection으로 따로 있다.

interface CardListSectionProps {
  title: string;
  products: readonly HomeProductCard[];
  variant?: 'demand' | 'succeeded';
}

export function CardListSection({ title, products, variant }: CardListSectionProps) {
  return (
    <section className="flex w-full flex-col gap-3">
      <SectionHeader title={title} />
      <HorizontalScroller className="gap-5">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            href={ROUTES.product(product.id)}
            variant={variant}
          />
        ))}
      </HorizontalScroller>
    </section>
  );
}
