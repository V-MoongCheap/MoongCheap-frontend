import Image from 'next/image';

import { ComingSoonButton } from '@/components/ui/ComingSoonButton';
import { HOME_SECTIONS } from '@/constants/homeMessages';
import { HorizontalScroller } from '@/features/home/components/HorizontalScroller';
import { SectionHeader } from '@/features/home/components/SectionHeader';
import { isRenderableImageSrc } from '@/lib/imageSource';
import type { HomeBrandDeal } from '@/types/home';

// card-list-5(현재 인기 브랜드딜). 시안 `981:18299`. 카드 260×142 + 아래 두 줄.
//
// 상품 카드와 달리 참여 인원·희망가격대가 없고 D-day 배지가 흰 배경 + 코랄 글씨다.
//
// 브랜드딜 상세 화면은 IA에도 기능명세에도 없다. 시안에만 있는 진입점이라 '준비 중' 토스트다.

interface BrandDealSectionProps {
  deals: readonly HomeBrandDeal[];
}

export function BrandDealSection({ deals }: BrandDealSectionProps) {
  return (
    <section className="flex w-full flex-col gap-3">
      <SectionHeader title={HOME_SECTIONS.brandDeal.title} />

      <HorizontalScroller className="gap-[22px]">
        {deals.map((deal) => (
          <ComingSoonButton
            className="flex w-[260px] shrink-0 flex-col gap-3 text-left"
            key={deal.id}
          >
            <span className="rounded-8 bg-background-default relative block h-[142px] w-full overflow-hidden">
              {/* 그릴 수 있는 경로만 통과시킨다. 이유는 `lib/imageSource` 참고(`ProductCard`와 같다). */}
              {isRenderableImageSrc(deal.imageUrl) && (
                <Image alt="" className="object-cover" fill sizes="260px" src={deal.imageUrl} />
              )}
              {/*
                시안은 배지를 왼쪽 기준(left 213)으로 두었는데, `D-10`처럼 글자가 길어지면
                오른쪽으로 넘친다. 위 여백과 같은 12로 오른쪽에 붙였다(시안 대비 3px 차이).
              */}
              <span className="rounded-4 text-label-12 text-content-brand bg-normal-1 absolute top-3 right-3 flex h-[22px] items-center justify-center px-2">
                D-{deal.dday}
              </span>
            </span>

            <span className="text-content-primary flex w-full flex-col">
              <span className="text-label-16 w-full truncate">{deal.title}</span>
              {/* 설명 줄에 별도 색이 없다. 시안 그대로 제목과 같은 색을 쓴다. */}
              <span className="text-caption-10 w-full">{deal.description}</span>
            </span>
          </ComingSoonButton>
        ))}
      </HorizontalScroller>
    </section>
  );
}
