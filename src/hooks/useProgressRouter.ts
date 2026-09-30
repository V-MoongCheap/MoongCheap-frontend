'use client';

import { useMemo } from 'react';

import { useRouter } from 'next/navigation';

import { startNavigationProgress } from '@/lib/navigationProgress';

type AppRouter = ReturnType<typeof useRouter>;

/**
 * `useRouter`와 같지만 `push`·`replace` 전에 화면 전환 진행 바를 켠다(#215).
 *
 * 검색 실행, 참여 카드, 제출 뒤 이동처럼 `Link`가 아닌 코드 이동은 문서 클릭으로 잡을 수 없어서
 * 이 훅이 대신 알린다. `back`은 이미 받아 둔 화면을 다시 쓰는 경우가 많아 그대로 둔다.
 */
export function useProgressRouter(): AppRouter {
  const router = useRouter();

  return useMemo(
    () => ({
      ...router,
      push: (...args: Parameters<AppRouter['push']>) => {
        startNavigationProgress(args[0]);
        router.push(...args);
      },
      replace: (...args: Parameters<AppRouter['replace']>) => {
        startNavigationProgress(args[0]);
        router.replace(...args);
      },
    }),
    [router],
  );
}
