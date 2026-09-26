import type { Metadata } from 'next';
import { connection } from 'next/server';

import { HOME_SECTIONS } from '@/constants/homeMessages';
import { BannerCarousel } from '@/features/home/components/BannerCarousel';
import { BrandDealSection } from '@/features/home/components/BrandDealSection';
import { BrandSection } from '@/features/home/components/BrandSection';
import { CardListSection } from '@/features/home/components/CardListSection';
import { CategoryGrid } from '@/features/home/components/CategoryGrid';
import { DemandSection } from '@/features/home/components/DemandSection';
import { HomeHeader } from '@/features/home/components/HomeHeader';
import { PopularSection } from '@/features/home/components/PopularSection';
import { RowListSection } from '@/features/home/components/RowListSection';
import {
  mockGetBrandDeals,
  mockGetBrandProducts,
  mockGetBrands,
  mockGetClosingProducts,
  mockGetDeadlineProducts,
  mockGetDemandProducts,
  mockGetHomeBanners,
  mockGetInterestProducts,
  mockGetPopularProducts,
  mockGetSucceededProducts,
} from '@/mocks/home';

export const metadata: Metadata = {
  title: '뭉치',
};

// B-03 홈피드. 시안 `981:18157`.
//
// 페이지는 서버 컴포넌트로 둔다. 상태가 필요한 조각(캐러셀·카운트다운·페이징)만 client
// 리프로 격리한다.
//
// 섹션 순서와 이름은 시안의 `card-list-1` ~ `card-list-8` 순서 그대로다.
export default async function HomePage() {
  // 목의 마감 시각(`deadline`)은 현재 시각 기준 상대값이다. 정적 프리렌더되면 빌드 시각에
  // 굳어 배포 후 몇 시간 지나면 카운트다운이 전부 `00:00:00`이 되므로(#170) 요청 시점에 렌더한다.
  await connection();

  const [
    banners,
    demandProducts,
    closingProducts,
    interestProducts,
    succeededProducts,
    brandDeals,
    deadlineProducts,
    popularProducts,
    brands,
    brandProducts,
  ] = await Promise.all([
    mockGetHomeBanners(),
    mockGetDemandProducts(),
    mockGetClosingProducts(),
    mockGetInterestProducts(),
    mockGetSucceededProducts(),
    mockGetBrandDeals(),
    mockGetDeadlineProducts(),
    mockGetPopularProducts(),
    mockGetBrands(),
    mockGetBrandProducts(),
  ]);

  return (
    <main className="flex w-full flex-col">
      <HomeHeader />
      <BannerCarousel banners={banners} />
      <CategoryGrid />

      {/* 섹션 사이 간격은 시안 실측 96px로 일정하다. */}
      <div className="flex w-full flex-col gap-24">
        <DemandSection products={demandProducts} />

        <RowListSection
          description={HOME_SECTIONS.closing.description}
          products={closingProducts}
          title={HOME_SECTIONS.closing.title}
        />

        <CardListSection products={interestProducts} title={HOME_SECTIONS.interest.title} />

        <CardListSection
          products={succeededProducts}
          title={HOME_SECTIONS.succeeded.title}
          variant="succeeded"
        />

        <BrandDealSection deals={brandDeals} />

        <RowListSection
          description={HOME_SECTIONS.deadline.description}
          products={deadlineProducts}
          title={HOME_SECTIONS.deadline.title}
        />

        <PopularSection products={popularProducts} />

        <BrandSection brands={brands} products={brandProducts} />
      </div>
    </main>
  );
}
