import Image from 'next/image';
import Link from 'next/link';

import { HOME_CARD } from '@/constants/homeMessages';
import { TimeBadge } from '@/features/home/components/TimeBadge';
import { WishButton } from '@/features/home/components/WishButton';
import { cn } from '@/lib/cn';
import { isRenderableImageSrc } from '@/lib/imageSource';
import type { HomeProductCard } from '@/types/home';

// 가로 스크롤 섹션의 세로 카드(폭 121). 시안이 두 벌을 쓴다.
//
//   'demand'    card-list-1·3 (632:5110). 마감 배지 + 참여 인원 배지 + `희망가격대` 라벨
//   'succeeded' card-list-4   (655:2114). 배지 없음, 가격만 코랄색 한 줄, 이미지에 테두리
//
// 정보 구조가 같아 한 컴포넌트로 두고 다른 곳만 분기했다.
//
// 카드 전체가 상품 상세(B-08, /products/[id])로 가는 링크다. 찜 버튼은 카드 안에 겹쳐
// 있지만 별개 동작이라, 링크와의 중첩(HTML 위반)을 피하려고 형제로 두고 절대 배치했다.

/**
 * 시안: 흰 배경 80% + 테두리 #e6e6e6, radius 4. D-day와 카운트다운이 같은 자리를 쓴다.
 *
 * 색은 전부 모드와 무관한 토큰으로 고정한다(#98). 글자를 시맨틱 `content-primary`로 두면 다크에서
 * 흰색으로 바뀌어, 흰 바탕 위에서 글자가 사라지고 회색 네모만 남는다. 다크 시안도 같은 조합이라
 * 다크용 배지 설계가 없어, 두 모드 모두 라이트 모양을 쓰기로 했다. 바탕은 시안 변수
 * `badge/surface/white-A100` 그대로다.
 */
const TIME_BADGE_CLASS =
  'border-coolgray-200 rounded-4 text-label-10 text-coolgray-950 bg-badge-surface-white-a100 border px-1 py-0.5 opacity-80';

/** 시안: `badge/surface/sky` = 하늘색 20%. */
const PERSONNEL_BADGE_CLASS = 'rounded-4 text-label-10 text-content-primary bg-sky-a20 px-1 py-0.5';

type ProductCardVariant = 'demand' | 'succeeded';

interface ProductCardProps {
  product: HomeProductCard;
  /** 카드가 여는 상세 경로. 라우트는 호출부(features/home 섹션)가 정한다. */
  href: string;
  variant?: ProductCardVariant;
}

export function ProductCard({ product, href, variant = 'demand' }: ProductCardProps) {
  const isSucceeded = variant === 'succeeded';
  const hasTime = product.dday !== undefined || product.deadline !== undefined;

  return (
    <article className="relative flex w-[121px] shrink-0 flex-col gap-2">
      <Link href={href} className="flex w-full flex-col gap-2 text-left">
        <span
          className={cn(
            'rounded-8 bg-surface-tertiary relative block aspect-square w-full overflow-hidden',
            // 시안이 흰 배경 상품 사진에만 테두리를 넣었는데, 어떤 상품이 흰 배경인지는
            // 데이터로 알 수 없다. 성사된 공구 카드 전체에 넣어 통일했다.
            isSucceeded && 'border-border-subtle border',
          )}
        >
          {/* 앱이 그릴 수 있는 경로만 통과시킨다. 백엔드 썸네일은 외부 절대 URL이라 그대로 넘기면
              `next/image`가 예외를 던지고 홈 화면 전체가 오류로 바뀐다(`lib/imageSource`).
              못 그리면 위 컨테이너의 회색 배경이 그대로 남는다. */}
          {isRenderableImageSrc(product.thumbnailUrl) && (
            <Image alt="" className="object-cover" fill sizes="121px" src={product.thumbnailUrl} />
          )}

          {!isSucceeded && hasTime && (
            <span className="absolute top-0 right-0 flex flex-col items-end p-1">
              <TimeBadge
                className={TIME_BADGE_CLASS}
                dday={product.dday}
                deadline={product.deadline}
              />
            </span>
          )}
        </span>

        <span className="flex w-full flex-col gap-4">
          <span className="flex w-full flex-col gap-1">
            {!isSucceeded && product.participantCount !== undefined && (
              <span className="flex items-start">
                <span className={PERSONNEL_BADGE_CLASS}>
                  {HOME_CARD.participants(product.participantCount)}
                </span>
              </span>
            )}
            <span className="flex w-full flex-col">
              <span className="text-label-16 text-content-primary w-full truncate">
                {product.name}
              </span>
              {product.sellerCount !== undefined && (
                <span className="text-caption-10 text-content-tertiary w-full">
                  {HOME_CARD.sellers(product.sellerCount)}
                </span>
              )}
            </span>
          </span>

          <span className="flex w-full flex-col text-right">
            {!isSucceeded && (
              <span className="text-caption-10 text-content-quarternary w-full">
                {HOME_CARD.desiredPriceTight}
              </span>
            )}
            <span
              className={cn(
                'text-label-16 w-full',
                isSucceeded ? 'text-content-brand' : 'text-content-primary',
              )}
            >
              {product.desiredPriceLabel}
            </span>
          </span>
        </span>
      </Link>

      {/*
        찜 버튼. 시안에서는 이미지 박스 안쪽 아래에 오른쪽 정렬로 얹혀 있다(px-8 py-4).
        카드 전체 버튼과 겹치지 않게 형제로 두고, 이미지 높이(= 카드 폭, 정사각)만큼만
        차지하게 한다. 덮개는 클릭을 통과시키고 버튼만 받는다.
      */}
      <span className="pointer-events-none absolute top-0 left-0 flex h-[121px] w-full items-end justify-end px-2 py-1">
        <WishButton />
      </span>
    </article>
  );
}
