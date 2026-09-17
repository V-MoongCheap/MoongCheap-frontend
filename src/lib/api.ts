/**
 * 백엔드 REST 호출 최소 래퍼.
 *
 * 공용 응답 포맷·전역 에러 규약은 백엔드와 아직 합의되지 않았다(CLAUDE.md). 그래서 광범위한
 * api-client는 만들지 않고, #18 소셜 로그인 완결에 필요한 만큼만 둔다. 규격이 확정되면 여기에
 * 응답 언래핑·에러 매핑을 얹는다.
 *
 * - 베이스 URL은 `NEXT_PUBLIC_API_BASE_URL`(소셜 인가 이동과 동일 소스, lib/oauth.ts).
 * - 세션은 SID httpOnly 쿠키라 모든 호출에 `credentials: 'include'`가 필수다(브라우저가 쿠키를
 *   자동 첨부·수신). 로컬은 localhost:3000↔8080이 동일 site(포트는 site 판정에서 제외)라
 *   SameSite=Lax 쿠키가 그대로 흐른다. 배포에서 도메인이 갈리면 SameSite=None·Secure가 필요하다.
 */

/**
 * 백엔드 베이스 URL. 미배선(빈 값)이면 null.
 * 소셜 인가 이동(lib/oauth.ts)과 REST 호출이 같은 소스를 쓰도록 여기서 한 번만 정의해 내보낸다.
 */
export function getApiBaseUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (raw === undefined || raw === '') {
    return null;
  }
  // 값 뒤에 슬래시가 붙어 와도 이중 슬래시가 되지 않도록 정리한다.
  return raw.replace(/\/+$/, '');
}

/**
 * 400 유효성 실패 시 실려 오는 필드별 사유. 폼의 해당 입력에 그대로 붙일 수 있다.
 * 백엔드 규격상 400이 아닌 응답에서는 빈 배열이다.
 */
export interface ApiFieldError {
  field: string;
  message: string;
}

/** 백엔드 실패 응답 본문. `docs/api-error-responses.md`의 공통 형식. */
interface ApiErrorBody {
  code?: unknown;
  message?: unknown;
  fieldErrors?: unknown;
  /**
   * 한 겹 감싼 모양(`{ success, data, error }`)의 안쪽. 규격은 평면인데 실제로 두 모양이 나온다.
   *
   * `@RestControllerAdvice`가 처리하는 응답은 문서대로 평면으로 나가지만, 스프링 시큐리티
   * 필터가 직접 쓰는 **401·403·소셜가입 미완료**만 감싼 모양으로 나간다(`SecurityConfig`,
   * `IncompleteSignupFilter`가 문자열로 조립한다). 백엔드 내부 불일치라 통일을 요청해 뒀고,
   * 정리될 때까지 두 모양을 모두 받는다. 401은 로그인 안 한 모든 화면이 처음 만나는 응답이라
   * 여기서 놓치면 사유가 통째로 사라진다.
   */
  error?: unknown;
}

/**
 * 실패한 응답(비 2xx)·네트워크 오류·미배선을 하나의 타입으로 올린다.
 *
 * - `status`  HTTP 상태 코드. 네트워크 오류·미배선은 0이라 호출부가 401(미로그인) 등을 분기할 수 있다.
 * - `code`    백엔드 비즈니스 에러 코드(`SHIP_002` 등). 본문이 없거나 규격을 벗어나면 null이다.
 * - `message` 백엔드가 준 사용자용 문구를 그대로 쓴다. 없으면 상태 코드 기반 기본 문구.
 *
 * 같은 400이라도 `code`로 갈린다. 예를 들어 배송지 등록의 400은 `SHIP_002`(상한 5개)와
 * `COMMON_400`(입력값 오류)이 다른 화면 반응을 요구한다. status만으로는 구분할 수 없다.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly fieldErrors: readonly ApiFieldError[];

  constructor(
    message: string,
    status: number,
    code: string | null = null,
    fieldErrors: readonly ApiFieldError[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

/** `fieldErrors` 배열에서 규격에 맞는 항목만 추린다. 형태가 어긋난 원소는 버린다. */
function parseFieldErrors(value: unknown): ApiFieldError[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item): ApiFieldError[] => {
    if (typeof item !== 'object' || item === null) {
      return [];
    }
    const { field, message } = item as Record<string, unknown>;
    if (typeof field !== 'string' || typeof message !== 'string') {
      return [];
    }
    return [{ field, message }];
  });
}

/**
 * 실패 응답 본문을 읽어 ApiError로 만든다.
 *
 * 본문이 규격대로 오지 않는 경우가 실제로 있다. 게이트웨이 502가 HTML을 주거나, 본문이 비어
 * 있거나, JSON이지만 필드가 없을 수 있다. 그래서 어느 단계에서 실패하든 상태 코드만으로도
 * 던질 수 있게 만든다. 여기서 예외가 나면 원래 에러가 통째로 묻힌다.
 */
async function toApiError(response: Response): Promise<ApiError> {
  const fallback = `요청이 실패했습니다(HTTP ${response.status}).`;

  let body: ApiErrorBody | null = null;
  try {
    body = (await response.json()) as ApiErrorBody;
  } catch {
    return new ApiError(fallback, response.status);
  }

  if (typeof body !== 'object' || body === null) {
    return new ApiError(fallback, response.status);
  }

  // 감싼 모양이면 안쪽을 읽는다. 평면이면 본문이 곧 내용이다.
  const payload: ApiErrorBody =
    typeof body.error === 'object' && body.error !== null ? (body.error as ApiErrorBody) : body;

  const message =
    typeof payload.message === 'string' && payload.message !== '' ? payload.message : fallback;
  const code = typeof payload.code === 'string' && payload.code !== '' ? payload.code : null;
  return new ApiError(message, response.status, code, parseFieldErrors(payload.fieldErrors));
}

/**
 * 생성 계열 엔드포인트의 응답에서 id를 읽어 화면이 필요로 하는 문자열로 돌려준다.
 *
 * 백엔드 공통 응답은 `Map<String, Long>`이 아니라 `{ "id": 123 }` 단일 필드 객체다. 배송지 등록·
 * 수요 등록 등 생성 엔드포인트가 모두 이 모양을 돌려준다. 응답을 `unknown`으로 받아 여기서
 * 검증하므로, 백엔드 응답을 그대로 옮긴 타입을 화면 계층(`types`)에 두지 않는다. 200이어도
 * 숫자 id가 없으면 규격 위반이라 실패로 올린다.
 */
export async function parseCreatedId(response: Response): Promise<string> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiError('생성 응답 본문을 읽지 못했습니다.', response.status);
  }

  if (typeof body === 'object' && body !== null) {
    const { id } = body as Record<string, unknown>;
    // 백엔드 Long은 2^63까지지만 JSON.parse는 2^53(MAX_SAFE_INTEGER) 초과분을 반올림한다.
    // isFinite는 반올림된 값도 통과시켜 실제 ID와 다른 문자열을 돌려주므로 isSafeInteger로 막는다.
    // 전 범위가 필요해지면 백엔드가 id를 문자열로 주도록 계약을 바꿔야 한다.
    if (typeof id === 'number' && Number.isSafeInteger(id)) {
      return String(id);
    }
  }
  throw new ApiError('생성 응답에서 id를 찾지 못했습니다.', response.status);
}

/**
 * 베이스 URL을 붙이고 세션 쿠키를 실어 fetch한다. 비 2xx면 ApiError를 던진다.
 * 응답 파싱은 엔드포인트마다 모양이 달라 여기서 하지 않고 Response를 그대로 돌려준다(호출부가 파싱).
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const baseUrl = getApiBaseUrl();
  if (baseUrl === null) {
    throw new ApiError('API 베이스 URL이 설정되지 않았습니다(NEXT_PUBLIC_API_BASE_URL).', 0);
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      credentials: 'include',
    });
  } catch {
    // fetch는 네트워크 단절·CORS 차단 등에서 reject한다. 상태 코드가 없으므로 0으로 표기한다.
    throw new ApiError('네트워크 오류로 요청에 실패했습니다.', 0);
  }

  if (!response.ok) {
    throw await toApiError(response);
  }
  return response;
}
