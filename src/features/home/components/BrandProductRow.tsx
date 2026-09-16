import Image from 'next/image';
import Link from 'next/link';

import { HOME_CARD } from '@/constants/homeMessages';
import { TimeBadge } from '@/features/home/components/TimeBadge';
import type { HomeProductCard } from '@/types/home';

// card-list-8(브랜드별 인기 공구)의 카드. 시안 `981:18342`(354×106).
//
// WideProductRow(310×120)와 달리 마감 배지가 이미지 위가 아니라 정보 칸 안에서 인원 배지와
// 나란히 놓인다. 이미지도 106이다.

/**
 * 시안: 흰 배경 80% + 테두리 #e6e6e6, radius 4.
 * 색을 모드와 무관하게 고정한 이유는 `ProductCard`의 같은 상수 주석 참고(#98).
 */
const TIME_BADGE_CLASS =
  'border-coolgray-200 rounded-4 text-label-10 text-coolgray-950 bg-badge-surface-white-a100 border px-1 py-0.5 whitespace-nowrap opacity-80';

/** 시안 `badge/surface/gary` = 회색 20%. */
const PERSONNEL_BADGE_CLASS =
  'rounded-4 text-label-10 text-content-primary bg-coolgray-a20 px-1 py-0.5 whitespace-nowrap';

interface BrandProductRowProps {
  product: HomeProductCard;
  /** 카드가 여는 상세 경로. 라우트는 호출부(features/home 섹션)가 정한다. */
  href: string;
}

export function BrandProductRow({ product, href }: BrandProductRowProps) {
  return (
    <Link href={href} className="flex w-full items-center gap-2 text-left">
      <span className="rounded-8 bg-surface-tertiary relative block size-[106px] shrink-0 overflow-hidden">
        {product.thumbnailUrl !== undefined && (
          <Image alt="" className="object-cover" fill sizes="106px" src={product.thumbnailUrl} />
        )}
      </span>

      <span className="flex h-[103px] w-[240px] shrink-0 flex-col justify-between">
        <span className="flex w-full flex-col gap-1">
          <span className="flex items-start gap-1">
            <TimeBadge
              className={TIME_BADGE_CLASS}
              dday={product.dday}
              deadline={product.deadline}
            />
            {product.participantCount !== undefined && (
              <span className={PERSONNEL_BADGE_CLASS}>
                {HOME_CARD.participants(product.participantCount)}
              </span>
            )}
          </span>
          <span className="flex w-full flex-col">
            <span className="text-label-16 text-content-primary w-full truncate">
              {product.name}
            </span>
            {product.brandName !== undefined && (
              <span className="text-caption-10 text-content-tertiary w-full">
                {product.brandName}
              </span>
            )}
          </span>
        </span>

        <span className="flex w-full flex-col text-right">
          <span className="text-caption-10 text-content-tertiary w-full">
            {HOME_CARD.desiredPriceSpaced}
          </span>
          <span className="text-label-16 text-content-primary w-full">
            {product.desiredPriceLabel}
          </span>
        </span>
      </span>
    </Link>
  );
}
