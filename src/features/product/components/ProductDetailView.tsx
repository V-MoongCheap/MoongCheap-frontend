'use client';

import { useEffect, useRef, useState } from 'react';

import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Accordion } from '@/components/ui/Accordion';
import { ComingSoonButton } from '@/components/ui/ComingSoonButton';
import { GoBackButton } from '@/components/ui/GoBackButton';
import { PRODUCT_DETAIL } from '@/constants/productMessages';
import { WishButton } from '@/features/home/components/WishButton';
import { QuickDealCard } from '@/features/product/components/QuickDealCard';
import { cn } from '@/lib/cn';
import { fetchProductCatalogDetail } from '@/lib/productApi';
import type { ProductDetail } from '@/types/product';

// B-08 상품 상세 화면 본문. 시안 node 1153:72748(퀵 참여 0건) / 1153:73735(3건).
//
// 구성: 뒤로가기 헤더 · 상품 이미지(실시간 열람 배지 + '비슷한 상품' 칩) · 브랜드 행(찜) ·
//       상품명/규격 · 진행중인 뭉치 퀵 참여 · 상품설명(자세히 보기 펼침) · 정보 아코디언 3종 ·
//       하단 고정 CTA(뭉치 참여하기).
//
// 데이터: 상품 도감 상세(name·규격·썸네일·상품설명·정가)는 `GET /api/product-catalog/{id}`로
// **client에서** 실데이터를 받아 mock 위에 덮는다(세션 쿠키가 필요해 서버 컴포넌트에서 못 부름,
// [[lib/productApi]]). 미로그인/미배선/숫자 아닌 id(홈 목)면 조회가 실패하고 mock을 그대로 쓴다.
// 브랜드·실시간 열람수·퀵참여딜·비슷한상품·정보 아코디언은 BE 규격이 없어 계속 mock이다.
//
// 미구현 진입점은 노출하되 탭 시 '준비 중' 토스트다(ComingSoonButton).
//  - 비슷한 상품(Full) · 찜(시안 전용) · 퀵 참여 딜 카드→수요 상세(B-12)

/** 상품설명 접힘 높이(px). 이보다 길면 자세히 보기 버튼과 하단 페이드를 노출한다. */
const DESCRIPTION_COLLAPSED_MAX = 240;

interface ProductDetailViewProps {
  product: ProductDetail;
}

export function ProductDetailView({ product: initialProduct }: ProductDetailViewProps) {
  const [product, setProduct] = useState(initialProduct);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [descriptionOverflows, setDescriptionOverflows] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  // 상품 도감 상세를 실데이터로 덮는다. 실패(미로그인·미배선·네트워크)면 mock 유지.
  useEffect(() => {
    // 백엔드 id는 숫자 Long이다. 홈 목의 문자열 id(demand-1 등)는 확정 400이 나므로 호출을 건너뛴다.
    if (!/^\d+$/.test(initialProduct.id)) {
      return;
    }
    let active = true;
    fetchProductCatalogDetail(initialProduct.id)
      .then((dto) => {
        if (!active) return;
        setProduct((prev) => ({
          ...prev,
          name: dto.name,
          spec: dto.specSummary ?? prev.spec,
          thumbnailUrl: dto.thumbnailUrl,
          listPrice: dto.listPrice ?? prev.listPrice,
          // 조회 성공 시 description은 서버 값을 그대로 반영한다. null이면 undefined로 두어
          // 상품설명 섹션을 숨긴다(mock 설명으로 대체하지 않는다 — 다른 상품 문구 노출 방지).
          description: dto.description ?? undefined,
        }));
      })
      .catch(() => {
        // 조회 실패는 정상 경로(로그인 전·백엔드 미기동). mock 그대로 보여준다.
      });
    return () => {
      active = false;
    };
  }, [initialProduct.id]);

  // 상품설명이 접힘 높이를 넘는지 측정해 자세히 보기 노출을 결정한다(짧으면 버튼/페이드 없음).
  useEffect(() => {
    const el = descriptionRef.current;
    setDescriptionOverflows(el !== null && el.scrollHeight > DESCRIPTION_COLLAPSED_MAX + 1);
  }, [product.description]);

  const hasDescription = product.description !== undefined && product.description !== '';
  const clampDescription = descriptionOverflows && !descriptionExpanded;

  return (
    <>
      <header className="border-divider-default flex h-13 w-full shrink-0 items-center border-b">
        <GoBackButton className="text-content-tertiary flex h-13 w-10 shrink-0 items-center px-2">
          <ChevronLeft aria-hidden className="size-6" />
          <span className="sr-only">뒤로 가기</span>
        </GoBackButton>
      </header>

      <div className="flex flex-1 flex-col">
        {/* 상품 이미지 + 실시간 열람 배지 + '비슷한 상품' 칩 */}
        <section className="relative flex h-[322px] w-full flex-col justify-end overflow-hidden px-4 py-[19px]">
          <div
            aria-hidden
            className="bg-background-default absolute inset-0 flex items-center justify-center p-8"
          >
            {product.thumbnailUrl !== undefined && (
              <div className="relative size-full">
                <Image
                  alt=""
                  className="object-contain"
                  fill
                  priority
                  sizes="393px"
                  src={product.thumbnailUrl}
                />
              </div>
            )}
          </div>

          {/* 실시간 열람 배지(상단 중앙). 인원 수만 코랄 강조. */}
          <div className="absolute inset-x-0 top-3 flex justify-center">
            <span className="bg-background-default border-border-subtle text-body-14 rounded-full border px-2.5 py-1">
              <span className="text-content-secondary">{PRODUCT_DETAIL.viewingPrefix}</span>
              <span className="text-button-14 text-content-brand">
                {PRODUCT_DETAIL.viewingCount(product.viewingCount)}
              </span>
              <span className="text-content-secondary">{PRODUCT_DETAIL.viewingSuffix}</span>
            </span>
          </div>

          {/* 비슷한 상품 칩(좌하단). Full 기능이라 진입점만 노출. */}
          <ComingSoonButton className="relative flex w-fit items-center">
            {product.similarThumbnails?.slice(0, 2).map((thumb, index) => (
              <span
                key={thumb}
                className={cn(
                  'border-border-subtle rounded-4 bg-surface-tertiary relative size-[30px] shrink-0 overflow-hidden border',
                  index > 0 && '-ml-3.5',
                )}
              >
                <Image alt="" className="object-cover" fill sizes="30px" src={thumb} />
              </span>
            ))}
            <span className="bg-background-default border-border-subtle rounded-4 -ml-2 flex items-center gap-1 border px-2.5 py-1">
              <span className="text-body-14 text-content-secondary whitespace-nowrap">
                {PRODUCT_DETAIL.similarProducts}
              </span>
              <ChevronRight aria-hidden className="text-content-tertiary size-5" />
            </span>
          </ComingSoonButton>
        </section>

        {/* 브랜드 행 + 상품명/규격 */}
        <section className="border-border-subtle flex w-full flex-col gap-4 border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 py-1">
              <span className="bg-surface-tertiary relative size-6 shrink-0 overflow-hidden rounded-full">
                {product.brandLogoUrl !== undefined && (
                  <Image
                    alt=""
                    className="object-cover"
                    fill
                    sizes="24px"
                    src={product.brandLogoUrl}
                  />
                )}
              </span>
              <span className="text-body-15 text-content-tertiary">{product.brandName}</span>
            </div>
            <WishButton />
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="text-heading-20 text-content-primary">{product.name}</h1>
            <p className="text-title-17 text-content-quarternary">{product.spec}</p>
          </div>
        </section>

        {/* 진행중인 뭉치 퀵 참여 */}
        <section className="flex w-full flex-col px-4 py-3">
          <div className="flex h-[46px] items-center">
            <p className="text-button-14 text-content-tertiary">
              {PRODUCT_DETAIL.quickDealsLead(product.quickDeals.length)}
              <span className="text-content-primary">{PRODUCT_DETAIL.quickDealsUnit}</span>
            </p>
          </div>

          {product.quickDeals.length > 0 && (
            <div className="flex gap-2 overflow-x-auto py-2">
              {product.quickDeals.map((deal) => (
                <QuickDealCard
                  deal={deal}
                  href={`/demands/${encodeURIComponent(deal.id)}`}
                  key={deal.id}
                />
              ))}
            </div>
          )}
        </section>

        {/* 상품설명. BE description(TEXT). 없으면 섹션을 숨긴다. */}
        {hasDescription && (
          <section className="flex w-full flex-col gap-2">
            <div className="flex items-center px-4 py-2.5">
              <h2 className="text-title-17 text-content-secondary">
                {PRODUCT_DETAIL.descriptionHeading}
              </h2>
            </div>

            <div className="px-4">
              {/* 접힘 높이는 max-h-[240px]로, 오버플로 측정 기준 DESCRIPTION_COLLAPSED_MAX(240)와
                  값이 일치해야 한다. */}
              <div className={cn('relative overflow-hidden', clampDescription && 'max-h-[240px]')}>
                <p
                  ref={descriptionRef}
                  className="text-body-15 text-content-secondary whitespace-pre-line"
                >
                  {product.description}
                </p>

                {clampDescription && (
                  <div
                    aria-hidden
                    className="to-background-default pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent"
                  />
                )}
              </div>
            </div>

            {descriptionOverflows && (
              <div className="p-4">
                <button
                  type="button"
                  aria-expanded={descriptionExpanded}
                  onClick={() => setDescriptionExpanded((prev) => !prev)}
                  className="border-border-tertiary rounded-8 focus-visible:ring-effect-focus-ring-primary flex h-12 w-full items-center justify-center gap-2 border px-3 outline-none focus-visible:ring-2"
                >
                  <span className="text-button-15 text-content-tertiary">
                    {descriptionExpanded ? PRODUCT_DETAIL.collapse : PRODUCT_DETAIL.viewMore}
                  </span>
                  <ChevronDown
                    aria-hidden
                    className={cn(
                      'text-content-tertiary size-6 transition-transform',
                      descriptionExpanded && 'rotate-180',
                    )}
                  />
                </button>
              </div>
            )}
          </section>
        )}

        {/* 정보 아코디언 3종. 얇은 상단 구분선으로 섹션을 나눈다. */}
        <section className="flex w-full flex-col">
          {product.infoSections.map((info) => (
            <Accordion key={info.id} title={info.title} className="border-border-subtle border-t">
              {info.body}
            </Accordion>
          ))}
        </section>
      </div>

      {/* 하단 고정 CTA → 수요 등록·참여(B-09). 수요 등록 화면은 상품 하나에서 출발하므로 경로가
          이 상품 아래에 있다(`app/products/[productId]/demand`). 두 화면이 같은 조회를 쓰기 때문에
          여기서 그린 상품이면 그쪽에서도 같은 상품이 나온다. */}
      <footer className="bg-background-default sticky bottom-0 w-full p-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
        <Link
          className="bg-surface-button-primary-default text-content-oncolor text-button-15 active:bg-surface-button-primary-pressed rounded-8 flex h-12 w-full items-center justify-center"
          href={`/products/${encodeURIComponent(product.id)}/demand`}
        >
          {PRODUCT_DETAIL.participateCta}
        </Link>
      </footer>
    </>
  );
}
