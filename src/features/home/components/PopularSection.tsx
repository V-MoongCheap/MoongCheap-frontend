import { HOME_SECTIONS } from '@/constants/homeMessages';
import { ROUTES } from '@/constants/routes';
import { HorizontalScroller } from '@/features/home/components/HorizontalScroller';
import { SectionHeader } from '@/features/home/components/SectionHeader';
import { WideProductRow } from '@/features/home/components/WideProductRow';
import type { HomeProductCard } from '@/types/home';

// card-list-7(현재 인기 공구 상품). 시안 `981:18317`.
//
// 한 열에 카드 2장을 세로로 쌓고, 열을 가로로 넘긴다(열 간격 33, 카드 간격 16).

/** 시안: 한 열에 2장. */
const ROWS_PER_COLUMN = 2;

interface PopularSectionProps {
  products: readonly HomeProductCard[];
}

export function PopularSection({ products }: PopularSectionProps) {
  const columns: HomeProductCard[][] = [];
  for (let index = 0; index < products.length; index += ROWS_PER_COLUMN) {
    columns.push(products.slice(index, index + ROWS_PER_COLUMN));
  }

  return (
    <section className="flex w-full flex-col gap-3">
      <SectionHeader title={HOME_SECTIONS.popular.title} />
      <HorizontalScroller className="gap-[33px]">
        {columns.map((column) => (
          <div className="flex shrink-0 flex-col gap-4" key={column[0]?.id}>
            {column.map((product) => (
              <WideProductRow
                key={product.id}
                product={product}
                href={ROUTES.product(product.id)}
              />
            ))}
          </div>
        ))}
      </HorizontalScroller>
    </section>
  );
}
