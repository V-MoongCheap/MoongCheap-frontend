'use client';

import { type PointerEvent, useEffect, useRef, useState } from 'react';

import Image from 'next/image';

import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/lib/cn';
import type { HomeBanner, HomeBannerImagePosition } from '@/types/home';

// 배너 캐러셀. 시안 `981:18163`(361×217, radius 12) + 프로토타입 `981:19122`(11장).
//
// 가로 스크롤 + 스냅으로 만들고, 그 위에 자동 넘김을 얹는다. 간격 2초 · 마지막 장 다음은 첫 장으로
// 돌아가 반복하는 것이 프로토타입 동작이다(2026-09-15 재생 확인). 손으로 밀어 넘기는 것은 그대로 된다.
//
// 마지막에서 첫 장으로 갈 때도 **앞으로** 미끄러져야 한다. 스크롤 컨테이너에서 0번 위치로 그냥
// 부드럽게 이동하면 열 장을 거꾸로 훑고 지나간다. 그래서 첫 장의 복제본을 끝에 한 장 더 두고,
// 마지막 다음에는 그 복제본으로 평소처럼 앞으로 넘어간 뒤, 스크롤이 멎으면 즉시(애니메이션 없이)
// 진짜 첫 장 자리로 되돌린다. 두 장이 같은 그림이라 되돌리는 순간은 보이지 않는다.
//
// ⚠️ 시안 카운터가 1번만 `1/11`이고 나머지는 `N/10`이다. 11번째를 나중에 추가하면서 앞의
// 총 개수를 못 고친 것으로 보여, 총 개수는 슬라이드 수에서 계산한다. 복제본은 총 개수에서 뺀다.
//
// 자동 넘김을 멈추는 수단이 필요하다(무한히 움직이는 콘텐츠, WCAG 2.2.2). 시안에 정지 버튼이 없어
// 버튼을 새로 만들지 않고, 사용자가 보거나 만지는 동안 멈추는 쪽으로 처리한다.
//   - 마우스를 올렸을 때 · 손가락으로 만지는 동안 · 안쪽 요소에 키보드 포커스가 있을 때
//   - 탭이 보이지 않을 때(백그라운드에서 타이머만 도는 것도 막는다)
//   - 기기가 '동작 줄이기'를 켰을 때는 아예 돌지 않는다
//
// 배너 이미지는 아직 없을 수 있다(이슈 #60). 없으면 회색 자리로 둔다.
//
// 오버레이 문구가 있는 배너는 그 문구가 곧 이미지 설명이라 이미지를 장식으로 두고(`alt=""`),
// 문구가 이미지에 인쇄된 배너만 `imageAltText`를 받아 대체 텍스트로 넣는다.

/** 시안: 아래쪽만 어두워지는 오버레이. 흰 글씨 가독성용이다. */
const OVERLAY_CLASS =
  'pointer-events-none absolute inset-0 bg-[linear-gradient(180.33deg,rgba(82,82,82,0)_60.268%,rgba(82,82,82,0.315)_82.092%,rgba(82,82,82,0.8)_99.521%)]';

/** 자동 넘김 간격. 프로토타입 재생 기준 2초. */
const AUTOPLAY_INTERVAL_MS = 2000;

/**
 * 스크롤이 멎었다고 보는 시간. 이 시간 동안 스크롤 이벤트가 없으면 복제본에서 첫 장으로 되돌린다.
 *
 * `scrollend` 이벤트가 더 정확하지만 지원하지 않는 브라우저가 있어 쓰지 않는다. 부드러운 이동과
 * 손가락을 뗀 뒤의 관성이 모두 끝날 만큼 넉넉하면서, 다음 자동 넘김(2초)보다는 충분히 짧아야 한다.
 */
const SCROLL_SETTLE_MS = 250;

/**
 * 배너별 초점. 원본 비율이 제각각이라(세로형 · 아주 넓은 형) 전부 가운데로 채우면 시안과 다른
 * 부분이 보인다. 값의 근거는 `types/home.ts`의 `HomeBannerImagePosition` 주석에 있다.
 *
 * 클래스를 문자열로 늘어놓는 이유는 Tailwind가 소스에서 이름을 그대로 찾아 생성하기 때문이다.
 * 값을 조립해 만들면 CSS가 나오지 않는다.
 */
const IMAGE_POSITION_CLASS: Record<HomeBannerImagePosition, string> = {
  center: 'object-center',
  bottom: 'object-bottom',
  lower78: 'object-[center_78%]',
  left: 'object-left',
  horizontal38: 'object-[38%_center]',
};

interface BannerCarouselProps {
  banners: readonly HomeBanner[];
}

export function BannerCarousel({ banners }: BannerCarouselProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const resetTimerRef = useRef<number | null>(null);
  const [index, setIndex] = useState(0);
  /** 마우스를 올렸거나 만지는 중이거나 안쪽에 포커스가 있는 상태. 자동 넘김을 멈춘다. */
  const [isInteracting, setIsInteracting] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const prefersReducedMotion = usePrefersReducedMotion();

  /** 마지막 다음에도 앞으로 넘어가도록 첫 장을 끝에 한 번 더 그린다. 한 장뿐이면 필요 없다. */
  const hasLoopClone = banners.length > 1;
  const slides = hasLoopClone ? [...banners, banners[0]] : banners;

  // 스크롤 위치에서 현재 장을 되읽는다. 스냅이 멈추는 지점이 곧 각 장의 왼쪽 끝이다.
  const handleScroll = () => {
    const viewport = viewportRef.current;
    if (viewport === null || viewport.clientWidth === 0) {
      return;
    }

    const position = Math.round(viewport.scrollLeft / viewport.clientWidth);
    // 복제본(마지막 칸)은 첫 장과 같은 그림이라 카운터도 1로 센다.
    setIndex(position % banners.length);

    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    if (!hasLoopClone || position !== banners.length) {
      return;
    }

    // 복제본에서 멎으면 진짜 첫 장 자리로 되돌린다. 같은 그림이라 화면은 그대로다.
    resetTimerRef.current = window.setTimeout(() => {
      viewport.scrollTo({ left: 0, behavior: 'auto' });
    }, SCROLL_SETTLE_MS);
  };

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const update = () => {
      setIsPageVisible(!document.hidden);
    };

    update();
    document.addEventListener('visibilitychange', update);
    return () => {
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  const isAutoplayOn =
    banners.length > 1 && !isInteracting && isPageVisible && !prefersReducedMotion;

  useEffect(() => {
    if (!isAutoplayOn) {
      return;
    }

    const timer = window.setInterval(() => {
      const viewport = viewportRef.current;
      if (viewport === null || viewport.clientWidth === 0) {
        return;
      }

      // 다음 장은 상태가 아니라 스크롤 위치에서 계산한다. 손으로 민 위치와 타이머가 어긋나지 않는다.
      const position = Math.round(viewport.scrollLeft / viewport.clientWidth);
      if (position >= banners.length) {
        // 복제본에 있다. 곧 첫 장으로 되돌아가므로 이번 차례는 건너뛴다.
        return;
      }

      viewport.scrollTo({ left: (position + 1) * viewport.clientWidth, behavior: 'smooth' });
    }, AUTOPLAY_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [isAutoplayOn, banners.length]);

  // 마우스만 여기서 다룬다. 터치는 pointerleave가 늦게 오거나 오지 않아 계속 멈춘 채로 남는다.
  const handlePointerEnter = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') {
      setIsInteracting(true);
    }
  };

  const handlePointerLeave = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') {
      setIsInteracting(false);
    }
  };

  return (
    <div className="w-full px-4">
      <div className="rounded-12 relative h-[217px] w-full overflow-hidden">
        <div
          className="flex size-full snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto [&::-webkit-scrollbar]:hidden"
          onBlurCapture={() => setIsInteracting(false)}
          onFocusCapture={() => setIsInteracting(true)}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onScroll={handleScroll}
          onTouchCancel={() => setIsInteracting(false)}
          onTouchEnd={() => setIsInteracting(false)}
          onTouchStart={() => setIsInteracting(true)}
          ref={viewportRef}
        >
          {slides.map((banner, slideIndex) => {
            const isClone = hasLoopClone && slideIndex === banners.length;

            return (
              <div
                // 복제본은 첫 장과 같은 내용이라 보조 기술에는 감춘다.
                aria-hidden={isClone || undefined}
                className="relative h-full w-full shrink-0 snap-start"
                key={isClone ? `${banner.id}-clone` : banner.id}
              >
                {banner.imageUrl === undefined ? (
                  <div aria-hidden className="bg-surface-tertiary size-full" />
                ) : (
                  <Image
                    alt={isClone ? '' : (banner.imageAltText ?? '')}
                    className={cn(
                      'object-cover',
                      IMAGE_POSITION_CLASS[banner.imagePosition ?? 'center'],
                    )}
                    fill
                    sizes="393px"
                    src={banner.imageUrl}
                    priority={slideIndex === 0}
                  />
                )}

                {/* 문구가 이미지에 인쇄된 배너(시안 4·6번)는 오버레이도 글씨도 없다. */}
                {banner.title !== undefined && (
                  <>
                    <div aria-hidden className={OVERLAY_CLASS} />
                    <div className="text-content-oncolor absolute top-[137px] left-0 flex w-full flex-col px-3">
                      <p className="text-heading-24 w-full">{banner.title}</p>
                      {banner.description !== undefined && (
                        <p className="text-body-14 w-full">{banner.description}</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="pointer-events-none absolute top-0 right-0 flex items-center justify-center p-2.5">
          <span className="text-label-12 text-content-oncolor rounded-round border-border-oncolor bg-normal-1/20 border px-2 py-0.5">
            {index + 1}/{banners.length}
          </span>
        </div>
      </div>
    </div>
  );
}
