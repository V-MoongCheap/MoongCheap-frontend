'use client';

import { useEffect, useState } from 'react';

// 기기의 '동작 줄이기' 설정을 읽는다.
//
// CSS 애니메이션은 `app/animations.css` 맨 아래에서 한 번에 끄지만, JS 타이머로 도는 움직임
// (배너 자동 넘김 등)은 CSS로 멈출 수 없어 값을 직접 읽어야 한다.
//
// 서버 렌더에는 매체 질의가 없어 첫 렌더는 항상 `false`(동작 허용)로 시작하고, 마운트 직후
// 실제 값으로 맞춘다. 설정을 도중에 바꾸는 경우까지 따라가도록 `change`도 구독한다.
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(REDUCED_MOTION_QUERY);

    const update = () => {
      setPrefersReducedMotion(media.matches);
    };

    update();
    media.addEventListener('change', update);
    return () => {
      media.removeEventListener('change', update);
    };
  }, []);

  return prefersReducedMotion;
}
