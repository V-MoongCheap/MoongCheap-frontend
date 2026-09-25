import Image from 'next/image';
import Link from 'next/link';

import { SEARCH_RESULT_CARD } from '@/constants/searchMessages';
import { cn } from '@/lib/cn';
import { isRenderableImageSrc } from '@/lib/imageSource';
import type { ProductSearchResult } from '@/types/search';

// B-06 검색 결과 카드. 시안 컴포넌트 `search-results-card`(`I1153:72827;633:4962` 외).
//
// 시안이 두 모양을 쓴다.
//   수요 있음  마감 D-day 배지 + 상태 배지(모집중/마감임박) + 퀵참여 건수 + 참여 인원
//   수요 없음  `수요 없음` 배지 하나 + 상품명 + 규격. 상태 배지와 하단 행이 통째로 빠진다
// 정보 구조가 같아 한 컴포넌트로 두고 없는 값만 건너뛴다.
//
// 수요 값은 검색 응답에 없어 수요보드 조회로 채운다(#173). 조회 중에는 마감 배지 자리에 자리표시자를,
// 조회가 실패하면 배지를 빼서 '수요 없음'으로 잘못 보이지 않게 한다.
//
// ⚠️ 상태 배지 배경도 필터 칩과 같은 오바인딩이다(SearchFilterTabs 주석 참고). 이름이 아니라
//    실제 채움값을 따라 `surface-visibility` · `surface-error`에 맞췄다.
//
// ⚠️ `I1153:72828`(코어맥스) 카드만 상품명 색이 변수 대신 `rgba(0,0,0,0.8)`로 박혀 있다. 나머지
//    카드는 `content/primary`(#0a0a0a)라 그쪽으로 통일했다. 디자인 확인 대상.

/** 시안: 배지 공통. `surface-secondary` 바탕에 radius 4, 좌우 여백 4. */
const META_BADGE_CLASS =
  'bg-surface-secondary rounded-4 text-label-12 text-content-quarternary inline-flex items-center justify-center px-1';

/** 시안: 상태 배지. 높이 22, 좌우 여백 8, radius 4. */
const STATUS_BADGE_CLASS =
  'rounded-4 text-label-12 inline-flex h-[22px] shrink-0 items-center justify-center px-2';

const STATUS_BADGE: Record<
  NonNullable<ProductSearchResult['demandStatus']>,
  { label: string; className: string }
> = {
  gathering: {
    label: SEARCH_RESULT_CARD.gathering,
    className: 'bg-surface-visibility text-content-visibility',
  },
  closing: {
    label: SEARCH_RESULT_CARD.closing,
    className: 'bg-surface-error text-content-error',
  },
};

interface SearchResultCardProps {
  product: ProductSearchResult;
  /** 상품 상세 경로. 라우트는 호출부(page)가 정한다. */
  href: string;
  /** 수요보드 조회 상태. 없으면 조회를 마쳤거나(값이 `product`에 있다) 조회 대상이 아니다. */
  demandLoadState?: 'loading' | 'failed';
}

export function SearchResultCard({ product, href, demandLoadState }: SearchResultCardProps) {
  const status = product.demandStatus === undefined ? null : STATUS_BADGE[product.demandStatus];
  const hasFooter = product.quickDealCount !== undefined || product.participantCount !== undefined;

  return (
    <li className="w-full">
      {/* 시안: 바깥 테두리가 #f5f5f5다. 우리 토큰에서 그 값을 갖는 border는
          `border-button-quarternary` 하나뿐이라 이름은 어긋나지만 값이 맞는 쪽을 쓴다
          (globals.css는 design/tokens/build-tokens.mjs 생성물이라 손대지 않는다). */}
      <Link
        className="border-border-button-quarternary rounded-12 flex w-full flex-col overflow-hidden border"
        href={href}
      >
        {/* 시안: 높이 184 고정, 흰 바탕 위에 상품 사진이 가운데 놓인다. 시안마다 사진이 카드 폭의
            51~58%로 제각각이라 폭을 고정하지 않고 contain으로 맞춘다. */}
        <span className="bg-background-default relative block h-46 w-full">
          {isRenderableImageSrc(product.thumbnailUrl) && (
            <Image
              alt=""
              className="object-contain"
              fill
              sizes="361px"
              src={product.thumbnailUrl}
            />
          )}
        </span>

        <span className="border-border-subtle bg-background-default flex w-full flex-col gap-1 border-t px-3 py-2">
          {demandLoadState === 'loading' && (
            <span className="flex items-start">
              <span
                aria-hidden
                className="bg-surface-secondary rounded-4 inline-block h-4.5 w-16 animate-pulse"
              />
            </span>
          )}
          {demandLoadState === undefined && (
            <span className="flex items-start">
              <span className={META_BADGE_CLASS}>
                {product.dday === undefined ? (
                  SEARCH_RESULT_CARD.noDemand
                ) : (
                  // 한 겹 더 감싼다. 이 배지가 inline-flex라 `마감 `과 `D-1`을 나란히 두면 각각
                  // flex item이 되고, 그 과정에서 `마감 ` 끝의 공백이 잘려 `마감D-1`로 붙는다.
                  // 안쪽을 보통 inline 흐름으로 만들어 시안의 공백을 살린다.
                  <span>
                    {/* 시안: `마감 `은 회색이고 `D-1`만 코랄색이다. */}
                    {SEARCH_RESULT_CARD.deadlinePrefix}
                    <span className="text-content-brand">
                      {SEARCH_RESULT_CARD.dday(product.dday)}
                    </span>
                  </span>
                )}
              </span>
            </span>
          )}

          <span className="flex w-full items-center justify-between gap-2">
            <span className="text-title-18 text-content-primary min-w-0 truncate">
              {product.name}
            </span>
            {status !== null && (
              <span className={cn(STATUS_BADGE_CLASS, status.className)}>{status.label}</span>
            )}
          </span>

          {product.spec !== undefined && (
            <span className="text-label-13 text-content-quarternary w-full">{product.spec}</span>
          )}

          {hasFooter && (
            <span className="text-button-14 text-content-tertiary flex w-full items-center justify-between gap-2 whitespace-nowrap">
              {product.quickDealCount !== undefined && (
                <span>{SEARCH_RESULT_CARD.quickDeals(product.quickDealCount)}</span>
              )}
              {product.participantCount !== undefined && (
                // 왼쪽 값이 없어도 오른쪽에 붙도록 한다(justify-between은 하나만 남으면 왼쪽에 붙는다).
                <span className="ml-auto">
                  {SEARCH_RESULT_CARD.participants(product.participantCount)}
                </span>
              )}
            </span>
          )}
        </span>
      </Link>
    </li>
  );
}
