// 화면 전환 진행 바(`NavigationProgress`)의 시작 신호(#215).
//
// 동적 라우트는 탭한 뒤 서버 응답이 올 때까지 이전 화면이 그대로 멈춰 있다(테스트 서버에서 약 1초).
// Next.js는 이동이 시작됐다는 전역 신호를 주지 않는다(`useLinkStatus`는 링크 하나 안에서만 쓴다).
// 그래서 시작은 두 곳에서 이 모듈로 알린다.
//   - `Link` 탭: `NavigationProgress`가 문서의 클릭을 보고 알린다.
//   - 코드 이동(`router.push`·`router.replace`): `useProgressRouter`가 이동 전에 알린다.
// 끝은 주소(경로·쿼리)가 바뀐 것을 `NavigationProgress`가 보고 정한다.

type Listener = () => void;

const listeners = new Set<Listener>();

/** 경로와 쿼리만 남긴 비교용 키. 해시만 다른 주소는 같은 화면이다. */
export function toLocationKey(pathname: string, search: string): string {
  return search === '' ? pathname : `${pathname}?${search}`;
}

function urlToLocationKey(url: URL): string {
  return toLocationKey(url.pathname, url.searchParams.toString());
}

/**
 * `href`로 가는 이동이 시작됐음을 알린다. 다른 출처(외부 링크)나 지금과 같은 주소면 알리지 않는다.
 * 같은 주소로는 경로·쿼리가 바뀌지 않아 진행 바가 끝날 계기가 없기 때문이다.
 */
export function startNavigationProgress(href: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  const current = new URL(window.location.href);
  const target = new URL(href, current);
  if (target.origin !== current.origin) {
    return;
  }
  if (urlToLocationKey(target) === urlToLocationKey(current)) {
    return;
  }
  listeners.forEach((listener) => listener());
}

/** 이동 시작 신호를 구독한다. 돌려받은 함수로 해제한다. */
export function onNavigationStart(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
