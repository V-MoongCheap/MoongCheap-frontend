import Image from 'next/image';

import { ComingSoonButton } from '@/components/ui/ComingSoonButton';
import { HOME_SECTIONS } from '@/constants/homeMessages';
import { BrandProductRow } from '@/features/home/components/BrandProductRow';
import { SectionHeader } from '@/features/home/components/SectionHeader';
import { cn } from '@/lib/cn';
import { isRenderableImageSrc } from '@/lib/imageSource';
import type { HomeBrand, HomeProductCard } from '@/types/home';

// card-list-8(브랜드별 인기 공구). 시안 `981:18329`.
//
// 브랜드 칩을 가로로 넘기고, 아래에 선택된 브랜드의 상품 목록이 온다.
//
// ⚠️ 칩을 눌렀을 때 목록이 바뀌는 동작은 시안에 없다. 첫 칩만 선택 상태로 그려져 있고 다른
//    칩의 목록이 없다. 목 데이터로 지어내지 않고, 지금은 첫 칩 고정 + 나머지는 '준비 중'
//    토스트로 둔다. 목록 교체는 API 연동 때 붙인다.

interface BrandSectionProps {
  brands: readonly HomeBrand[];
  products: readonly HomeProductCard[];
}

export function BrandSection({ brands, products }: BrandSectionProps) {
  return (
    <section className="flex w-full flex-col gap-3">
      <SectionHeader title={HOME_SECTIONS.byBrand.title} />

      <div className="flex w-full flex-col gap-3 px-4">
        <div className="-mx-4 flex [scrollbar-width:none] items-center gap-3 overflow-x-auto px-4 [&::-webkit-scrollbar]:hidden">
          {brands.map((brand, index) => (
            <ComingSoonButton
              className={cn(
                'rounded-8 relative size-[60px] shrink-0 overflow-hidden border',
                // 시안: 선택된 칩만 테두리가 `border-strong`(#303030)이다.
                index === 0 ? 'border-border-primary' : 'border-border-subtle',
              )}
              key={brand.id}
            >
              {!isRenderableImageSrc(brand.logoUrl) ? (
                // 로고가 없으면 빈 버튼이 되어 표시 이름도 접근 가능한 이름도 사라진다.
                // 앱이 그릴 수 없는 외부 절대 주소도 같이 걸러 이름으로 대체한다. 그대로 넘기면
                // `next/image`가 예외를 던져 홈 화면 전체가 오류로 바뀐다(`lib/imageSource`).
                <span className="text-caption-10 text-content-primary flex size-full items-center justify-center px-1 text-center">
                  {brand.name}
                </span>
              ) : (
                <Image
                  alt={brand.name}
                  className="object-cover"
                  fill
                  sizes="60px"
                  src={brand.logoUrl}
                />
              )}
            </ComingSoonButton>
          ))}
        </div>

        <div className="flex w-full flex-col gap-3">
          {products.map((product) => (
            <BrandProductRow key={product.id} product={product} href={`/products/${product.id}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
