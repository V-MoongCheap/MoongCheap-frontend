'use client';

import { useRef, useState } from 'react';

import { ROUTES } from '@/constants/routes';
import { ProductRow } from '@/features/home/components/ProductRow';
import { cn } from '@/lib/cn';
import type { HomeProductCard } from '@/types/home';

// 가로로 넘기는 세로 목록. 시안 `981:18273`(한 장에 5행) + `981:18279`(하단 도트).
//
// ⚠️ 시안은 도트가 3개다. 한 장에 5행이므로 15건을 가정한 것인데, 시안이 실제로 준 데이터는
//    5건뿐이다. 없는 상품을 지어내지 않으려고 목은 시안의 5건만 담았고, 도트 개수는 데이터에서
//    계산한다. 그래서 지금 화면에는 도트가 1개만 보인다. 실제 건수는 API 연동 때 채워진다.
//
// 도트 색은 시안이 토큰에 묶지 않은 생 hex(#4F4F4F / #D9D9D9)다. #D9D9D9는 피그마 기본
// 도형 색이라 스타일을 지정하지 않은 것으로 보여, 팔레트에서 가장 가까운 값으로 맞췄다
// (#575757 / #d6d6d6, 차이 3~8/255).
//
// 시맨틱 토큰이 아니라 프리미티브를 쓴 이유는, 이 두 값에 대응하는 시맨틱 토큰이 없기 때문이다
// (#d6d6d6은 border 계열에만 있어 배경으로 쓰기에 맞지 않는다). 시안에서 색이 확정되면 교체한다.

/** 시안: 한 장에 5행. */
const ROWS_PER_PAGE = 5;

interface PagedRowListProps {
  products: readonly HomeProductCard[];
}

export function PagedRowList({ products }: PagedRowListProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);

  const pages: HomeProductCard[][] = [];
  for (let index = 0; index < products.length; index += ROWS_PER_PAGE) {
    pages.push(products.slice(index, index + ROWS_PER_PAGE));
  }

  const handleScroll = () => {
    const viewport = viewportRef.current;
    if (viewport === null || viewport.clientWidth === 0) {
      return;
    }
    setPage(Math.round(viewport.scrollLeft / viewport.clientWidth));
  };

  return (
    <div className="flex w-full flex-col">
      <div
        className="flex w-full snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto [&::-webkit-scrollbar]:hidden"
        onScroll={handleScroll}
        ref={viewportRef}
      >
        {pages.map((rows) => (
          <div
            className="flex w-full shrink-0 snap-start flex-col gap-4 px-4"
            key={rows[0]?.id ?? 'empty'}
          >
            {rows.map((product) => (
              <ProductRow key={product.id} product={product} href={ROUTES.product(product.id)} />
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-[5px] py-4">
        {pages.map((rows, index) => (
          <span
            aria-hidden
            className={cn(
              'size-1.5 rounded-full',
              index === page ? 'bg-coolgray-600' : 'bg-coolgray-300',
            )}
            key={rows[0]?.id ?? index}
          />
        ))}
      </div>
    </div>
  );
}
