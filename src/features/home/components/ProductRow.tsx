import Image from 'next/image';
import Link from 'next/link';

import { HOME_CARD } from '@/constants/homeMessages';
import { TimeBadge } from '@/features/home/components/TimeBadge';
import { isRenderableImageSrc } from '@/lib/imageSource';
import type { HomeProductCard } from '@/types/home';

// 세로 목록의 가로 행. 시안 컴포넌트 `img-card`(622:177 계열, 361×65).
//
// 세로 카드(ProductCard)와 담는 정보는 같지만 배치·색이 다르다.
//   - 마감 표시가 흰 배지가 아니라 코랄 배지(브랜드 20%)다
//   - 참여 인원 배지가 하늘색이 아니라 회색(20%)이다
//   - `희망 가격대` 라벨 색이 content/quarternary가 아니라 content/tertiary다
//   - 찜 버튼이 없다
// 그래서 한 컴포넌트로 합치지 않고 따로 둔다.
//
// 행 전체가 상품 상세(B-08, /products/[id])로 가는 링크다.

/** 시안 `badge/surface/brand` = 코랄 20%. 마감 임박 표시. */
const TIME_BADGE_CLASS =
  'rounded-4 text-label-10 text-content-brand bg-brand-a20 px-1 py-0.5 whitespace-nowrap';

/** 시안 `badge/surface/gary` = 회색 20%. */
const PERSONNEL_BADGE_CLASS =
  'rounded-4 text-label-10 text-content-primary bg-coolgray-a20 px-1 py-0.5 whitespace-nowrap';

interface ProductRowProps {
  product: HomeProductCard;
  /** 카드가 여는 상세 경로. 라우트는 호출부(features/home 섹션)가 정한다. */
  href: string;
}

export function ProductRow({ product, href }: ProductRowProps) {
  return (
    <Link href={href} className="flex h-[65px] w-full items-center gap-2 text-left">
      <span className="rounded-8 bg-surface-tertiary relative block size-[65px] shrink-0 overflow-hidden">
        {/* 그릴 수 있는 경로만 통과시킨다. 이유는 `lib/imageSource` 참고(`ProductCard`와 같다). */}
        {isRenderableImageSrc(product.thumbnailUrl) && (
          <Image alt="" className="object-cover" fill sizes="65px" src={product.thumbnailUrl} />
        )}
      </span>

      <span className="flex min-w-0 flex-1 flex-col justify-between self-stretch">
        <span className="flex items-center gap-1.5">
          <TimeBadge className={TIME_BADGE_CLASS} dday={product.dday} deadline={product.deadline} />
          {product.participantCount !== undefined && (
            <span className={PERSONNEL_BADGE_CLASS}>
              {HOME_CARD.participants(product.participantCount)}
            </span>
          )}
        </span>

        <span className="flex w-full items-center justify-between gap-2">
          <span className="flex min-w-0 flex-col">
            <span className="text-label-16 text-content-primary w-full truncate">
              {product.name}
            </span>
            {product.sellerCount !== undefined && (
              <span className="text-caption-10 text-content-tertiary w-full">
                {HOME_CARD.sellers(product.sellerCount)}
              </span>
            )}
          </span>

          <span className="flex shrink-0 flex-col items-end text-right">
            <span className="text-caption-10 text-content-tertiary">
              {HOME_CARD.desiredPriceSpaced}
            </span>
            <span className="text-label-16 text-content-primary">{product.desiredPriceLabel}</span>
          </span>
        </span>
      </span>
    </Link>
  );
}
