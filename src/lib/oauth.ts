import type { OAuthProvider } from '@/types/auth';

import { getApiBaseUrl } from './api';

/**
 * 소셜 로그인(카카오·구글) 진입 URL 생성.
 *
 * 백엔드 리다이렉트 주도 방식이다(#18). 프론트는 아래 경로로 "이동만" 하고, 카카오·구글과의
 * code 교환과 세션(SID httpOnly 쿠키) 발급은 전부 백엔드가 처리한다. 인증이 끝나면 백엔드가
 * 성공 시 `/oauth/callback`, 실패 시 `/oauth/failed?reason=...`로 다시 프론트로 리다이렉트한다.
 *
 * 베이스 URL은 `NEXT_PUBLIC_API_BASE_URL`로 주입한다(클라이언트에서 이동하므로 NEXT_PUBLIC 필요).
 * 백엔드가 값을 확정하기 전이라, 미배선이면 null을 돌려 호출부가 이동을 건너뛰게 한다.
 */

// 백엔드 표준 경로. code 교환·세션 발급은 서버가 담당하므로 프론트는 provider 이름만 붙인다.
// 베이스 URL 해석은 lib/api.ts의 getApiBaseUrl을 공유한다(인가 이동과 REST 호출이 동일 소스).
const AUTHORIZE_PATH = '/oauth2/authorization';

/**
 * 제공자별 인가 시작 URL. 베이스 URL(env)이 아직 없으면 null.
 * null이면 호출부는 이동하지 않는다(백엔드 값 배선 후 동작).
 */
export function getOAuthAuthorizeUrl(provider: OAuthProvider): string | null {
  const baseUrl = getApiBaseUrl();
  if (baseUrl === null) {
    return null;
  }
  return `${baseUrl}${AUTHORIZE_PATH}/${provider}`;
}

/**
 * Spring Security가 인가 요청을 세션에서 찾지 못했을 때의 오류 코드. 백엔드 실패 핸들러가 예외
 * 메시지를 reason에 그대로 싣고, 이 경우 메시지는 `[authorization_request_not_found] `다.
 * reason은 대개 예외 원문이지만 이 코드는 Spring이 고정한 상수라 판별에 쓸 수 있다.
 */
const STALE_AUTHORIZATION_REQUEST_CODE = 'authorization_request_not_found';

/**
 * 소셜 로그인 실패 reason이 "이미 끝난 인가 흐름에 다시 들어온 경우"인지(#156).
 *
 * 백엔드는 인가 요청(state)을 세션에 두고, 로그아웃은 그 세션을 폐기한다. 로그아웃 뒤 브라우저
 * 뒤로 가기로 방문 기록 속 카카오 인가 페이지에 다시 들어가면, 카카오가 새 code와 옛 state로
 * 백엔드에 되돌려 보내고 백엔드는 짝이 되는 요청을 찾지 못해 실패로 리다이렉트한다. 유저가 로그인을
 * 시도한 것이 아니므로 "로그인에 실패했어요"를 띄우지 않고 로그인 화면으로 보낸다.
 */
export function isStaleAuthorizationRequest(reason: string | undefined): boolean {
  return reason?.includes(STALE_AUTHORIZATION_REQUEST_CODE) ?? false;
}

/**
 * 베이스 URL(env)이 배선돼 인가 이동이 가능한 상태인지.
 * 미배선이면 클릭해도 이동할 수 없으므로, UI에서 연결된 버튼을 비활성화해 죽은 클릭을 막는다.
 */
export function isOAuthConfigured(): boolean {
  return getApiBaseUrl() !== null;
}
