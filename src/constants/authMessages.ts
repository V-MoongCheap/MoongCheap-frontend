/**
 * 인증 폼 검증 메시지 모음.
 *
 * 스키마·화면에 흩어지기 쉬운 사용자 문구를 한곳에서 관리한다(문구 통일·재사용, 추후 i18n 대비).
 * 회원가입 플로우(이메일→아이디→비밀번호→완료)와 로그인이 공유한다.
 */
export const AUTH_ERROR_MESSAGES = {
  id: {
    required: '아이디를 입력해 주세요',
    /** mock 중복 아이디. Figma 8-error 시안 문구. */
    taken: '이미 존재하는 아이디입니다',
    /** 형식 위반(특수문자·공백 등). 서버 규칙 확정 전 잠정: 영문·숫자만 허용. */
    format: '영문과 숫자만 사용할 수 있어요',
  },
  nickname: {
    required: '닉네임을 입력해 주세요',
    /** mock 중복 닉네임. 아이디와 동일하게 중복확인으로 통과가 결정된다. */
    taken: '이미 사용 중인 닉네임입니다',
  },
  email: {
    invalid: '올바른 이메일 형식이 아닙니다',
  },
  login: {
    /** 로그인 실패(아이디·비밀번호 불일치). 로그인 화면(#13) 때부터 쓰던 문구. */
    credentials: '아이디 또는 비밀번호가 일치하지 않습니다.',
  },
  password: {
    required: '비밀번호를 입력해 주세요',
    /**
     * 자릿수·조합 위반 공통 문구. Figma 9번(비밀번호) 헬퍼가 default·error에서 같은 문구라
     * 하나로 둔다. 서버 규칙이 확정되면 이 문구와 스키마 규칙을 함께 맞춘다.
     */
    rule: '8~16자리 대소문자, 특수기호, 숫자를 사용하여 입력해 주세요',
  },
} as const;

/**
 * 검증 통과(성공) 안내 문구.
 *
 * 회원가입 입력 단계는 로그인과 달리 유효 시 입력칸 아래에 녹색으로 성공 문구를 노출한다
 * (Figma success 상태). 단계별로 같은 문구를 써서 한곳에 둔다.
 */
export const AUTH_SUCCESS_MESSAGES = {
  confirmed: '확인되었습니다.',
} as const;

/**
 * 소셜 로그인 실패 안내 문구.
 *
 * 백엔드는 실패 시 `/oauth/failed?reason=<예외 메시지 원문(URL 인코딩)>`으로 리다이렉트한다
 * (jnj3j3/MoongCheap_backend@develop, OAuth2LoginFailureHandler 확인). reason은 안정된 코드가
 * 아니라 서버 내부 예외 메시지라, 그대로 노출하면 내부 사정이 새고 유저에겐 의미도 없다. 그래서
 * reason 내용은 화면에 쓰지 않고 항상 하나의 일반 문구로 안내한다(값 유무·형태와 무관).
 * (백엔드가 나중에 denied/provider_error 같은 안정 코드를 주기로 하면 여기서 매핑을 되살린다.)
 */
const OAUTH_FALLBACK_MESSAGE = '로그인에 실패했어요. 잠시 후 다시 시도해 주세요';

/** 소셜 로그인 실패 안내 문구. 백엔드 reason은 예외 원문이라 노출하지 않고 일반 문구로 통일한다. */
export function getOAuthFailureMessage(): string {
  return OAUTH_FALLBACK_MESSAGE;
}
