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

/**
 * 진행 바 상태. `loading`은 출발한 화면의 주소를 들고 있고, 주소가 바뀌면 `done`으로 한 방향으로만
 * 넘어간다. 주소를 매 렌더 비교해 단계를 계산하면, 도착 직후 0.5초 안에 뒤로가기로 출발 화면에
 * 돌아왔을 때 다시 `loading`이 되어 바가 최대 10초 떠 있었다(PR #226 리뷰).
 */
type Progress = { phase: 'idle' } | { phase: 'loading'; from: string } | { phase: 'done' };

export function NavigationProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const location = toLocationKey(pathname, search);

  const [progress, setProgress] = useState<Progress>({ phase: 'idle' });

  // 출발한 화면에서 주소가 바뀌면 도착이다. effect를 거치지 않고 렌더 중에 넘긴다(이전 렌더 값으로
  // 상태를 고치는 React 권장 방식). 조건이 `loading`일 때만 참이라 한 번만 실행된다.
  if (progress.phase === 'loading' && progress.from !== location) {
    setProgress({ phase: 'done' });
  }

  // 시작 신호는 이벤트 콜백에서 오므로 렌더 시점의 주소를 ref로 넘겨 둔다.
  const locationRef = useRef(location);
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    const unsubscribe = onNavigationStart(() =>
      setProgress({ phase: 'loading', from: locationRef.current }),
    );

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

  // 단계가 바뀔 때만 타이머를 다시 건다. `done`이 된 뒤에는 주소가 어디로 가든 타이머가 이어져
  // 0.5초 뒤 사라진다. 그 사이 새 이동이 시작되면(`loading`) 정리 함수가 사라지기 타이머를 지운다.
  useEffect(() => {
    if (progress.phase === 'loading') {
      const timer = window.setTimeout(() => setProgress({ phase: 'done' }), SAFETY_TIMEOUT_MS);
      return () => window.clearTimeout(timer);
    }
    if (progress.phase === 'done') {
      const timer = window.setTimeout(() => setProgress({ phase: 'idle' }), FADE_OUT_MS);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [progress.phase]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-60 h-[3px]">
      <div
        className="nav-progress-fill bg-surface-brand h-full w-full"
        data-phase={progress.phase}
      />
    </div>
  );
}
