'use client';

import { useEffect, useRef, useState } from 'react';

import { usePathname, useSearchParams } from 'next/navigation';

import {
  onNavigationStart,
  startNavigationProgress,
  toLocationKey,
} from '@/lib/navigationProgress';

// 화면 전환 진행 바(#215). 탭한 순간 화면 맨 위에 얇은 브랜드색 바가 차오르기 시작하고, 주소가
// 바뀌면 끝까지 찬 뒤 사라진다. 서버 응답을 기다리는 약 1초 동안 탭이 먹었는지 알 수 있게 한다.
//
// 시작 신호는 `lib/navigationProgress.ts`가 모은다. `Link` 탭은 여기서 문서 클릭을 보고 알리고,
// 코드 이동은 `useProgressRouter`가 알린다. 뒤로가기·앞으로가기는 켜지 않는다.
//
// ⚠️ 시안에 없는 요소다. 색(`surface-brand`)과 두께(3px)는 QA 요청에 맞춰 임의로 정했다.
//    바가 진행률을 뜻하지는 않는다. 서버 응답은 요청 한 건이라 퍼센트를 셀 근거가 없다.
//
// 루트 레이아웃에 한 번 마운트한다. `useSearchParams` 때문에 레이아웃이 Suspense로 감싼다.

/** 이 시간 안에 주소가 안 바뀌면(이동 실패·취소) 바를 거둔다. */
const SAFETY_TIMEOUT_MS = 10_000;
/** 끝까지 찬 바가 사라지는 연출 시간. `animations.css`의 done 전환 시간과 맞춘다. */
const FADE_OUT_MS = 500;
/** 시간 초과로 끝낸 상태. 주소 키는 항상 '/'로 시작하므로 겹치지 않는다. */
const TIMED_OUT = 'timed-out';

type Phase = 'idle' | 'loading' | 'done';

export function NavigationProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const location = toLocationKey(pathname, search);

  // 이동을 시작한 화면의 주소. 지금 주소와 같으면 아직 기다리는 중이고, 달라졌으면 도착한 것이다.
  const [startedFrom, setStartedFrom] = useState<string | null>(null);
  const phase: Phase =
    startedFrom === null ? 'idle' : startedFrom === location ? 'loading' : 'done';

  // 시작 신호는 이벤트 콜백에서 오므로 렌더 시점의 주소를 ref로 넘겨 둔다.
  const locationRef = useRef(location);
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    const unsubscribe = onNavigationStart(() => setStartedFrom(locationRef.current));

    function handleClick(event: MouseEvent) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }
      if ((anchor.target !== '' && anchor.target !== '_self') || anchor.hasAttribute('download')) {
        return;
      }
      startNavigationProgress(anchor.href);
    }

    document.addEventListener('click', handleClick);
    return () => {
      unsubscribe();
      document.removeEventListener('click', handleClick);
    };
  }, []);

  useEffect(() => {
    if (phase === 'loading') {
      const timer = window.setTimeout(() => setStartedFrom(TIMED_OUT), SAFETY_TIMEOUT_MS);
      return () => window.clearTimeout(timer);
    }
    if (phase === 'done') {
      const timer = window.setTimeout(() => setStartedFrom(null), FADE_OUT_MS);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [phase]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-60 h-[3px]">
      <div className="nav-progress-fill bg-surface-brand h-full w-full" data-phase={phase} />
    </div>
  );
}
