/**
 * 여러 화면이 공유하는 공통 UI 문구.
 *
 * 컴포넌트에 한글 카피를 박지 않고 여기서 관리한다(문구 통일·재사용·추후 i18n 대비).
 * 인증 전용 문구는 authMessages.ts에, 공통 상태 문구는 여기에 둔다.
 */

/**
 * MVP 미구현(Full 범위) 기능의 진입점을 탭했을 때 노출하는 토스트 문구.
 * 출처: 기능정의서 머리말 — "MVP 미구현 기능의 진입점은 노출하되, 탭 시 '준비 중인 기능이에요' 토스트를 노출한다."
 */
export const COMING_SOON_MESSAGE = '준비 중인 기능이에요';

/** 조회 실패 등 일반 오류 상태 문구. 출처: FN-B03-01 홈 피드 오류 상태. */
export const ERROR_STATE_MESSAGE = '잠시 후 다시 시도해 주세요';

/**
 * 세션 만료(401) 안내 토스트. 로그인 후 동작(변경·삭제 등)이 401로 실패하면 원인이 재로그인임을
 * 알린다. `NicknameChangeButton`이 로컬로 쓰던 같은 문구를 공용으로 올렸다(2곳 이상 사용).
 */
export const SESSION_EXPIRED_MESSAGE = '세션이 만료되었어요. 다시 로그인해 주세요.';

/** 오류 상태의 재시도 버튼 라벨. 출처: FN-B03-01 "[새로고침] 버튼". */
export const RETRY_LABEL = '새로고침';

/* ── 전체화면 오류(모든 error 페이지) ── */

/** 전체화면 오류의 제목. 출처: 시안 '모든화면 error 페이지'(453:26351). */
export const ERROR_SCREEN_TITLE = '서비스 이용이 원활하지 않아요';

/** 전체화면 오류의 본문. 시안이 두 줄로 끊어 놓았으므로 줄 단위로 둔다. */
export const ERROR_SCREEN_DESCRIPTION = [
  '불편을 드려 죄송합니다.',
  '잠시 후에 다시 시도해 주세요.',
] as const;

/** 전체화면 오류의 재시도 버튼 라벨. 출처: 시안. */
export const ERROR_SCREEN_RETRY_LABEL = '다시 시도';

/* ── B-24 계정 설정 확인 다이얼로그. 문구는 시안 그대로다. ── */

/** 로그아웃 확인. 출처: 시안 453:25474 · FN-B24-02. */
export const LOGOUT_CONFIRM = {
  title: '로그아웃 하시겠습니까?',
  message: '로그아웃 후 다시 이용하려면 로그인이 필요해요.',
  confirmLabel: '로그아웃',
} as const;

/** 회원탈퇴 확인. 출처: 시안 453:25499. */
export const WITHDRAW_CONFIRM = {
  title: '회원 탈퇴하시겠습니까?',
  message: '탈퇴 시 계정 정보와 이용 내역이 삭제되며 복구할 수 없어요.',
  confirmLabel: '회원탈퇴',
} as const;
