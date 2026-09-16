import Image from 'next/image';

import { SPLASH_ASSETS } from '@/constants/assets';
import { SPLASH_MESSAGES } from '@/constants/splashMessages';
import { SplashLoadingIndicator } from '@/features/auth/components/SplashLoadingIndicator';
import { SplashWordmark } from '@/features/auth/components/SplashWordmark';
import { cn } from '@/lib/cn';

// 스플래쉬. 시안 `1318:13032`(기본) · `1372:6186`(로딩 지연, 프레임 이름은 「후보2」).
// 다크 시안은 `1502:91763`(기본) · `1502:91801`(로딩 지연).
//
// 화면 ID가 없다. 기능명세서 FN-B01-03이 스플래쉬를 로그인(B-01)의 구성 요소로 정의한다.
// 트리거는 앱 콜드 스타트이고, 세션을 확인하는 동안 이 화면이 떠 있다가 유효하면 홈(B-03),
// 무효하면 오류 안내 없이 B-01로 간다.
//
// **지금은 화면만 있고 배선은 없다.** 전환 기준 시간·최소 노출 시간이 어디에도 정해져 있지
// 않아서(`constants/splashTiming.ts` 참고) 동작을 지어내지 않았다. 값이 정해지면 B-01에서
// 이 컴포넌트를 띄우고 세션 조회(`features/auth/session.ts`)와 이어 붙인다.
//
// 훅이 없어 서버 컴포넌트로 쓸 수 있다. 애니메이션은 전부 CSS다(`app/animations.css`).
//
// ⚠️ 배경이 시안에서 `surface-primary`에 묶여 있는데 그 토큰의 값은 #fafafa(거의 흰색)다.
//    실제 채움값 #ff5f66과 맞는 토큰은 `surface-brand`라 이름이 아니라 값을 따랐다. 검색
//    필터 칩(#63)·카드 테두리에서도 같은 오바인딩이 있었다. 다크 값(#ff7378)도 `surface-brand`와 맞는다.
//
// 다크 모드에서 달라지는 것은 워드마크 · 문구 색뿐이다(#99). 시안이 둘 다 `background/default`로
// 칠해 라이트는 흰색, 다크는 #1a1a1a다. 코랄 바탕 위 글자에 배경 토큰을 쓰는 게 어색해 보여도 시안
// 바인딩 그대로 옮겼다. 라이트 값이 흰색이라 라이트 화면은 전과 같다. 마스코트는 두 모드가 같은 그림이다.

/** 시안 폭 393 · 높이 852 기준으로 잰 값들. 화면 높이가 달라져도 비율이 아니라 이 관계를 지킨다. */
const LAYOUT = {
  /**
   * 워드마크 묶음(워드마크 144x66 + 문구, 사이 12)을 화면 세로 중앙에서 얼마나 끌어올릴지.
   *
   * 기본  묶음 중앙 369, 화면 중앙 426 → 57 위
   * 로딩  묶음 중앙 314, 화면 중앙 426 → 112 위
   */
  wordmarkLift: { default: '-translate-y-[57px]', loading: '-translate-y-[112px]' },
} as const;

/** 달리는 마스코트 두 장(움직이는 것·정지본)이 같은 자리에 놓이도록 위치를 공유한다. */
const MASCOT_RUNNING_CLASS = 'absolute bottom-35.25 left-0 w-full';

interface SplashScreenProps {
  /**
   * 어느 시안을 그릴지.
   *
   * `loading`은 세션 확인이 길어졌을 때 쓰는 「후보2」다. 확정안이 아니고 전환 기준 시간도
   * 없어서, 지금은 호출부가 직접 골라야 한다(스스로 바뀌지 않는다).
   */
  variant?: 'default' | 'loading';
}

export function SplashScreen({ variant = 'default' }: SplashScreenProps) {
  const isLoading = variant === 'loading';

  return (
    <div className="max-w-mobile bg-surface-brand relative mx-auto flex min-h-svh w-full flex-col items-center justify-center overflow-hidden">
      {/* 시안: 워드마크와 문구 사이 12. 둘 다 `background/default` 색이다(파일 머리 주석). */}
      <div
        className={cn(
          'text-background-default flex flex-col items-center gap-3',
          LAYOUT.wordmarkLift[variant],
        )}
      >
        <SplashWordmark />
        <p className="text-label-16">{SPLASH_MESSAGES.tagline}</p>
      </div>

      {isLoading ? (
        <>
          {/* 시안: 393x240을 화면 폭 전체에 깔고 아래에서 141 띄운다. 강아지가 프레임 안에서
              좌우로 뛰는 모션이 이미지 파일 자체에 들어 있어 CSS로 옮길 게 없다.

              같은 자리에 두 장을 둔다. 움직이는 쪽이 기본이고, 기기가 '동작 줄이기'를 켰을 때만
              정지본이 나온다. 애니메이션 WebP는 CSS로 멈출 수 없어 이 방법뿐이다. 고르는 것은
              전부 CSS가 한다(`app/animations.css`) — JS로 매체 질의를 읽으면 서버 렌더 결과와
              어긋난다.

              `unoptimized`는 애니메이션 WebP라 필요하다(안 붙이면 경고만 남고 동작은 같다). */}
          <Image
            alt=""
            className={cn(MASCOT_RUNNING_CLASS, 'splash-mascot-running')}
            height={240}
            priority
            src={SPLASH_ASSETS.mascotRunning}
            unoptimized
            width={393}
          />
          <Image
            alt=""
            className={cn(MASCOT_RUNNING_CLASS, 'splash-mascot-still')}
            height={240}
            priority
            src={SPLASH_ASSETS.mascotRunningStill}
            width={393}
          />
          {/* 시안: 묶음 아래쪽이 803.85 → 화면 아래에서 48. */}
          <div className="absolute bottom-12">
            <SplashLoadingIndicator />
          </div>
        </>
      ) : (
        /* 시안: 342x342를 왼쪽 끝에 붙이고 위에서 514에 둔다. 아래로 4 넘쳐서 잘린다.
           화면 높이가 시안과 다를 수 있으니 위가 아니라 아래를 기준으로 잡는다. */
        <Image
          alt=""
          className="absolute -bottom-1 left-0"
          height={342}
          priority
          src={SPLASH_ASSETS.mascot}
          width={342}
        />
      )}
    </div>
  );
}
