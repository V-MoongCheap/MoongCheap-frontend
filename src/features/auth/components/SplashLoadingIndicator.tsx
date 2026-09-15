import { SPLASH_MESSAGES } from '@/constants/splashMessages';

// 로딩 지연 스플래쉬의 하단 묶음. 시안 「후보2」 `1372:6195`, 다크 `1502:91810`.
//
// 실측(프레임 393x852 기준): 묶음 폭 194 · 진행바 높이 4.85 · 진행바와 문구 사이 12 ·
// 문구와 점 사이 8 · 점 27x6.
//
// ⚠️ 진행바는 실제 진행률이 아니다. 세션 확인은 요청 한 건이라 퍼센트를 셀 근거가 없어서
//    연출로만 차오른다(`app/animations.css`). 진행률로 바꾸기로 정해지면 폭을 상태로 준다.
//
// 진행바 트랙은 `surface-disabled-secondary`(라이트 #e6e6e6 · 다크 #575757)다(#99).
//
//    시안은 로컬 스타일 `surface-disabled`에 묶어 두었고, 그 값이 라이트 #e6e6e6 · 다크 #575757이다.
//    우리 토큰 중 이 값 쌍과 같은 것이 `surface-disabled-secondary`라 이름이 아니라 값을 따랐다.
//    예전에는 다크 시안이 없어 두 모드를 같은 회색(`coolgray-200`)으로 고정했는데, 다크 시안이 코랄
//    바탕 위에 짙은 회색 트랙을 쓰는 것으로 확인돼 바꿨다.
//
// 점 3개는 모드와 무관하게 프리미티브 `coolgray-200`(#e6e6e6)을 쓴다. 다크 시안에서 내보낸 점도
// #e6e6e6 둘 + 흰색 하나로 라이트와 같다(흰색은 튀어 오른 점, `app/animations.css`).

export function SplashLoadingIndicator() {
  return (
    <div className="flex w-[194px] flex-col items-center gap-3">
      {/* 트랙. 채움은 scaleX로 움직여서 트랙 밖으로 나가지 않게 감싼다. */}
      <div className="rounded-round bg-surface-disabled-secondary h-[4.85px] w-full overflow-hidden">
        <div className="splash-progress-fill bg-content-oncolor h-full w-full" />
      </div>

      <div className="flex items-center gap-2">
        <p className="text-caption-14 text-content-oncolor">{SPLASH_MESSAGES.loading}</p>

        {/* 시안 컴포넌트 `3 Dots/Jumping`. 원본이 원 3개뿐이라 SVG 파일 대신 마크업으로 옮겼다.
            애니메이션이 붙어야 해서 이쪽이 다루기 쉽다. 지름 6 · 사이 간격 4.5 → 전체 폭 27. */}
        <span aria-hidden className="flex items-center gap-[4.5px]">
          <span className="splash-dot rounded-round bg-coolgray-200 size-1.5" />
          <span className="splash-dot rounded-round bg-coolgray-200 size-1.5" />
          <span className="splash-dot rounded-round bg-coolgray-200 size-1.5" />
        </span>
      </div>
    </div>
  );
}
