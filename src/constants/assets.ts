/**
 * 정적 이미지 에셋 경로. public/images/ 하위 파일을 컴포넌트에 문자열로 박지 않고
 * 여기서 단일 관리한다(경로 오타 방지·파일 이동 시 한 곳만 수정). next/image의 src에 그대로 넘긴다.
 *
 * 지금은 여러 화면이 공유하는 예외/빈 상태 일러스트만 둔다. 화면 전용 에셋(홈 배너·상품 카드·
 * 카테고리 아이콘 등)은 각 화면을 구현하며 그 배선 시점에 추가한다.
 * (#60에서 public/images/ 하위에 반입만 해 둔 상태 — 화면 미구현.)
 */

/** 예외/빈 상태 일러스트. public/images/exception/ 공용. */
export const EXCEPTION_ASSETS = {
  /** 전체화면 오류(모든 error 페이지) 삽화. ErrorScreen에서 사용. */
  error: '/images/exception/error.webp',
  /** 결제수단 미등록 빈 상태의 지갑 일러스트. B-14. */
  emptyPayment: '/images/exception/empty-payment.webp',
  /** 주문/참여 내역 빈 상태 일러스트. B-21(화면 구현 시 배선). */
  emptyHistory: '/images/exception/empty-history.webp',
} as const;

/** 낙찰 결과(B-19) 화면 전용 일러스트. */
export const AWARD_RESULT_ASSETS = {
  /** 낙찰 성공 상단 축하 삽화. AwardResultView에서 사용. */
  celebrate: '/images/bid-result/1-1.webp',
} as const;

/** 상품 도감 검색(B-06) 화면 전용 일러스트. */
export const CATALOG_SEARCH_ASSETS = {
  /** 검색 결과 0건 삽화. SearchResultsView에서 사용. */
  emptyResult: '/images/catalog-search/1-1.webp',
} as const;

/**
 * 수요 등록/참여(B-09) 전용 에셋. public/images/demand-register/.
 *
 * 간편결제 사업자 로고 셋이다. 시안에서 토스는 벡터, 네이버·카카오는 이미지 채움인데 #60 일괄
 * 반입에서 셋 다 WebP로 들어왔다. 표시 크기의 정확히 4배라 고밀도 화면에서도 선명하다.
 *
 * 표시 크기가 사업자마다 다르다(시안 실측). 박스는 107x52로 같고 로고만 다르게 들어간다.
 *   토스 77.2x14 · 네이버 49x16.78 · 카카오 47x18
 */
export const DEMAND_FORM_ASSETS = {
  /** `toss pay` 워드마크(심볼+글자). 309x56. */
  tossPayLogo: '/images/demand-register/2-1.webp',
  /** `N pay` 워드마크. 196x68. */
  naverPayLogo: '/images/demand-register/2-2.webp',
  /** 카카오페이 워드마크(말풍선+`pay`). `kakao` 글자는 로고에 없다. 188x72. */
  kakaoPayLogo: '/images/demand-register/2-3.webp',
} as const;

/**
 * 회원가입 완료(B-01 / 10.가입완료) 전용 일러스트. public/images/signup/.
 *
 * Figma 최종(08.27 로그인·회원가입) 확정 3D 일러스트(인물 카드 + 코랄 체크 + 반짝이).
 * 편집자가 export/복사를 막아 벡터를 못 뽑아, 다크 시안(#1a1a1a 배경) 스크린샷에서 배경을
 * flood-fill로 제거해 투명 WebP로 만든 것이다(흰 카드 ↔ 검정 배경 대비가 커 깔끔히 분리됨).
 * 라이트 시안 스샷은 흰 카드가 흰 배경과 안 나뉘어 못 쓴다. 투명이라 라이트·다크 양쪽에서
 * 그대로 쓴다(테마별 파일 스왑 불필요 — 이 앱 다크는 media/class 이중이라 Tailwind dark:
 * 스왑이 OS-다크+data-theme 미설정에서 어긋난다). 원본 확정 벡터를 받으면 교체한다.
 */
export const SIGNUP_ASSETS = {
  /**
   * 가입 완료 축하 삽화. 공용 `SignupCompleteScreen`에서 사용하며, 로컬 회원가입 위저드(/signup)와
   * 소셜 가입 완료(/oauth/complete) 양쪽 진입점이 이를 공유한다. 원본 379x322(투명).
   */
  complete: '/images/signup/complete.webp',
} as const;

/** 스플래쉬(B-01 세션 확인) 전용 에셋. public/images/splash/. */
export const SPLASH_ASSETS = {
  // 워드마크 `뭉치`는 모드마다 색이 달라 파일이 아니라 인라인 SVG 컴포넌트다
  // (`features/auth/components/SplashWordmark.tsx`).
  /** 기본 스플래쉬의 마스코트. 원본 4960x4960 PNG를 684x684로 줄인 것(표시 342의 2배수). */
  mascot: '/images/splash/mascot.webp',
  /**
   * 로딩 지연 화면의 달리는 마스코트. **애니메이션 WebP**(54프레임 · 한 바퀴 6.8초)다.
   *
   * `next/image`는 애니메이션 이미지를 최적화에서 제외하므로 `unoptimized`를 붙여 쓴다.
   * 안 붙이면 동작은 같고 개발 서버에 경고만 남는다.
   */
  mascotRunning: '/images/splash/mascot-running.webp',
  /**
   * 위 애니메이션의 **첫 프레임**을 뽑아 둔 정지본. 기기가 '동작 줄이기'를 켰을 때 대신 그린다.
   *
   * 애니메이션 WebP는 이미지 파일 자체가 움직여서 CSS로 멈출 수 없다. 그래서 두 장을 다 두고
   * `prefers-reduced-motion`으로 골라 보여 준다(`app/animations.css`).
   *
   * 첫 프레임을 고른 이유는 두 가지다. 강아지가 오른쪽을 보고 달리는 자세라 진행 방향(왼→오)과
   * 맞고, 임의로 고른 게 아니라 '애니메이션의 시작점'이라는 규칙으로 설명된다.
   */
  mascotRunningStill: '/images/splash/mascot-running-still.webp',
} as const;

/**
 * 수요 상세(B-12) '뭉치 진행 과정' 5단계 아이콘. Figma node 981:15479에서 내보낸 SVG.
 * confirm(48시간)은 링 2개 + '48h' 텍스트를 단일 SVG로 합친 것이다.
 */
export const DEMAND_GUIDE_ASSETS = {
  /** 1. 수요신청. */
  request: '/images/demand-guide/step1-request.svg',
  /** 2. 마감. */
  close: '/images/demand-guide/step2-close.svg',
  /** 3. 낙찰 판정. */
  award: '/images/demand-guide/step3-award.svg',
  /** 4. 48시간 확인. */
  confirm: '/images/demand-guide/step4-confirm.svg',
  /** 5. 결제. */
  payment: '/images/demand-guide/step5-payment.svg',
} as const;
