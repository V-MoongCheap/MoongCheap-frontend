import { preload } from 'react-dom';

import { getApiBaseUrl } from './api';

/**
 * 화면이 처음 부를 GET API를 HTML `<head>`에서 미리 요청하게 한다(React `preload`, `as: 'fetch'`).
 *
 * 세션(SID httpOnly 쿠키)은 API 도메인에만 있어 서버 컴포넌트는 이 API를 부를 수 없다. 그래서 지금까지는
 * HTML → JS 다운로드 → 화면 실행 → API 요청 → 이미지 요청 순서로 이어져 LCP가 늦었다(Phase 4 Lighthouse
 * 측정 3.9~5.4초). preload 링크는 브라우저가 HTML을 읽자마자 쿠키를 실어 보내고, 나중에 화면 코드가 같은
 * 주소·같은 자격 증명 모드로 fetch하면 받아 둔 응답을 그대로 쓴다.
 *
 * 주소가 한 글자라도 다르면 응답을 다시 받으므로, 경로는 실제 조회 함수와 같은 경로 함수로 만든다
 * (`productCatalogDetailPath` 등). 서버 컴포넌트에서 렌더 중에 부른다.
 */
export function preloadApiGet(path: string): void {
  const baseUrl = getApiBaseUrl();
  if (baseUrl === null) {
    return;
  }
  preload(`${baseUrl}${path}`, { as: 'fetch', crossOrigin: 'use-credentials' });
}
