// 앱 내부 히스토리에 '뒤로 갈 앞선 항목'이 있는지 추적한다.
//
// GoBackButton은 돌아갈 곳이 없으면 fallbackHref로 보내야 하는데, 그 판별에 쓰던
// `window.history.length > 1`은 교차 출처·빈 탭 항목까지 세어 부정확했다. 외부 링크로
// `/demands/[id]`에 처음 들어와도 length가 2라 `back()`이 사이트를 벗어난다.
//
// Navigation API의 `canGoBack`은 이 판별에 정확하지만 Safari 등은 지원하지 않는다. 그런
// 브라우저를 위해 **앱이 직접 만든 항목만** 센다. GoBackButton은 Navigation API가 있으면 그쪽을
// 먼저 쓰고, 없을 때만 이 값을 본다([[GoBackButton]]).
//
// 방식: 각 히스토리 항목이 랜딩(문서 로드 시점) 위로 몇 칸 쌓였는지를 depth로 그 항목의
// `history.state`에 스탬프해 둔다. 이동이 일어나면 `syncNavigationHistory`가 **현재 항목에 스탬프가
// 있는지**로 push와 pop을 가른다.
//   - 스탬프 있음 = 전에 방문해 스탬프해 둔 항목 = 재방문(뒤/앞으로가기). 저장된 depth를 채택.
//   - 스탬프 없음 = Next가 새로 만든 항목 = push. depth를 1 늘려 스탬프.
// 이 판정은 **멱등**이라 같은 이동을 popstate와 pathname 변경이 각각 알려도(예: pathname을 바꾸는
// 뒤로가기) 결과가 같다. depth는 state에 저장돼 새로고침에도 살아남는다.
//
// 이전 구현은 pop 정보를 pendingPopDepth에 담아 pathname 변경 시점에 소비했는데, 쿼리만 바뀐
// popstate는 pathname 변경이 없어 그 값이 소비되지 않고 다음 push에 잘못 적용되는 문제가 있었다.
// 지연 없이 매 이동마다 현재 항목의 스탬프로 판정하는 이 방식은 그 구멍이 없다.
//
// 남는 경계(모두 '안전한 쪽' = depth 과소 → 항목 없다고 보고 fallback으로 보냄): 쿼리만 바뀌는
// push는 pathname 변경이 없어 세지 못한다. 다만 이 앱의 뒤로가기 사용처(404·B-12 확인)는 쿼리
// 기반 화면이 아니라 실제 영향이 없다.

const DEPTH_KEY = '__mcHistoryDepth';

/** 현재 보이는 항목의 depth. */
let currentDepth = 0;

function readStateDepth(): number | null {
  const state = window.history.state as Record<string, unknown> | null;
  const value = state?.[DEPTH_KEY];
  return typeof value === 'number' ? value : null;
}

/** Next가 넣어 둔 state를 보존하며 현재 항목에 depth를 스탬프한다. */
function stampCurrentEntry(): void {
  window.history.replaceState({ ...window.history.state, [DEPTH_KEY]: currentDepth }, '');
}

/** 문서 로드 시 한 번. 새로고침이면 저장된 depth를 복구하고, 첫 진입이면 0으로 찍는다. */
export function initNavigationHistory(): void {
  const saved = readStateDepth();
  if (saved !== null) {
    currentDepth = saved;
    return;
  }
  currentDepth = 0;
  stampCurrentEntry();
}

/**
 * 이동(push/pop, 쿼리 변경 포함)마다 호출. 현재 항목에 스탬프가 있으면 재방문(pop)이라 저장된
 * depth를 채택하고, 없으면 새 항목(push)이라 depth를 늘려 스탬프한다. 멱등이다.
 */
export function syncNavigationHistory(): void {
  const stored = readStateDepth();
  if (stored !== null) {
    currentDepth = stored;
    return;
  }
  currentDepth += 1;
  stampCurrentEntry();
}

/** 뒤로 갈 앱 내부 항목이 있는지. */
export function hasInAppHistoryEntry(): boolean {
  return currentDepth > 0;
}

/** 일부 브라우저(주로 Chromium)만 지원하는 Navigation API의 필요한 부분만 좁혀 쓴다. */
interface NavigationApi {
  readonly canGoBack?: boolean;
}

/**
 * 이 페이지에서 `router.back()`으로 돌아갈 **앱 내부** 항목이 있는지. Navigation API의 canGoBack이
 * 정확한 신호라(현재가 히스토리의 첫 항목이면 false) 지원 브라우저에선 그것을 쓴다.
 *
 * 미지원 브라우저(예: Safari)에선 `window.history.length`를 쓰면 안 된다 — 교차 출처·빈 탭 항목까지
 * 세므로, 외부 링크로 처음 들어와도 length가 2가 되어 back()이 사이트를 벗어난다. 대신 앱이 직접
 * 센 내부 히스토리를 본다(위 depth 스탬프).
 *
 * GoBackButton(뒤로 가기)과 배송지 폼(저장 후 복귀, #165)이 쓴다.
 */
export function canGoBackInApp(): boolean {
  const nav = (window as unknown as { navigation?: NavigationApi }).navigation;
  if (nav !== undefined && typeof nav.canGoBack === 'boolean') {
    return nav.canGoBack;
  }
  return hasInAppHistoryEntry();
}
