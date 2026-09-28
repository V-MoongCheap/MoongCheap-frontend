import { AUTH_ERROR_MESSAGES } from '@/constants/authMessages';
import type { SignupMode, SignupValues } from '@/schemas/auth';
import type { AuthResult, SessionUser } from '@/types/auth';

/**
 * 인증 목 데이터.
 *
 * 백엔드 API 규격이 확정되기 전까지 화면을 완성하기 위한 임시 구현이다.
 * 실제 연동 시 이 파일의 함수를 API 호출로 교체하며, 반환 타입(`AuthResult`)은 그대로 둔다.
 * 화면은 반환 타입만 알고 있으므로 교체 시 화면을 고치지 않는다.
 */

const MOCK_LATENCY_MS = 600;

/** 이미 사용 중인 것으로 취급할 아이디. 중복확인 실패(에러) 화면을 확인하기 위한 값이다. */
const TAKEN_ID = 'moongchi';

const mockUser: SessionUser = {
  id: 'u_00000000',
  nickname: '뭉치',
  email: 'demo@moongcheap.dev',
  role: 'CONSUMER',
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * 아이디 중복확인 목. 회원가입 아이디 단계의 `중복확인` 버튼이 호출한다.
 * `TAKEN_ID`만 사용 불가로 돌려 error 화면을 확인하고, 나머지는 사용 가능으로 처리한다.
 * 실제 연동 시 이 본문만 실제 조회 API로 교체한다(반환 타입 유지).
 */
export async function mockCheckIdDuplicate(id: string): Promise<AuthResult<{ available: true }>> {
  await delay(MOCK_LATENCY_MS);

  if (id === TAKEN_ID) {
    return { ok: false, message: AUTH_ERROR_MESSAGES.id.taken };
  }

  return { ok: true, data: { available: true } };
}

/** 이미 사용 중인 것으로 취급할 닉네임. 중복확인 실패(에러) 화면을 확인하기 위한 값이다. */
const TAKEN_NICKNAME = '뭉치';

/**
 * 닉네임 중복확인 목. 회원가입 닉네임 단계의 `중복확인` 버튼이 호출한다(아이디와 동일 구조).
 * `TAKEN_NICKNAME`만 사용 불가로 돌려 error 화면을 확인하고, 나머지는 사용 가능으로 처리한다.
 * 실제 연동 시 이 본문만 실제 조회 API로 교체한다(반환 타입 유지).
 */
export async function mockCheckNicknameDuplicate(
  nickname: string,
): Promise<AuthResult<{ available: true }>> {
  await delay(MOCK_LATENCY_MS);

  if (nickname === TAKEN_NICKNAME) {
    return { ok: false, message: AUTH_ERROR_MESSAGES.nickname.taken };
  }

  return { ok: true, data: { available: true } };
}

/** 인증 성공으로 처리할 목 인증번호. 나머지 코드는 실패로 돌려 에러 화면을 확인한다. */
const VALID_PHONE_CODE = '123456';

/**
 * 휴대폰 인증번호 발송 목. 회원가입 휴대폰 인증 단계의 `인증번호 전송`이 호출한다.
 * 백엔드 SMS 규격이 미확정이라 어떤 번호든 발송 성공으로 처리한다(happy-path).
 * 실제 연동 시 이 본문만 발송 API로 교체한다(반환 타입 유지).
 */
export async function mockSendPhoneCode(phone: string): Promise<AuthResult<{ sent: true }>> {
  await delay(MOCK_LATENCY_MS);

  // 형식만 확인(빈 번호 방어). 실제 발송 여부·성공은 서버가 판단한다.
  if (phone.length === 0) {
    return { ok: false, message: '휴대폰 번호를 입력해 주세요' };
  }
  return { ok: true, data: { sent: true } };
}

/**
 * 휴대폰 인증번호 확인 목. `VALID_PHONE_CODE`만 통과로 돌려 error 화면을 확인하고,
 * 나머지는 불일치로 처리한다. 실제 연동 시 이 본문만 검증 API로 교체한다(반환 타입 유지).
 */
export async function mockVerifyPhoneCode(
  phone: string,
  code: string,
): Promise<AuthResult<{ verified: true }>> {
  await delay(MOCK_LATENCY_MS);

  if (phone.length > 0 && code === VALID_PHONE_CODE) {
    return { ok: true, data: { verified: true } };
  }
  return { ok: false, message: '인증번호가 일치하지 않습니다.' };
}

/**
 * 회원가입 목. 비밀번호 단계까지 통과한 값으로 계정 생성을 시도한다.
 * 백엔드 미연동이라 항상 성공을 돌려 가입완료 화면으로 진입할 수 있게 한다(happy-path).
 * 실제 연동 시 이 본문만 교체하면 서버 검증 실패(필드 오류)도 `AuthResult`로 흘러온다.
 */
export async function mockSignup(
  // 계정 정보(email/id/password)에 더해 온보딩에서 고른 mode·인증한 phone까지 받는다.
  // 백엔드 규격 확정 시 이 payload를 실제 가입 API에 그대로 매핑한다.
  values: SignupValues & { mode: SignupMode; phone: string },
): Promise<AuthResult<SessionUser>> {
  await delay(MOCK_LATENCY_MS);

  return {
    ok: true,
    data: {
      ...mockUser,
      id: values.id,
      nickname: values.nickname,
      email: values.email,
      role: values.mode === 'seller' ? 'SELLER' : 'CONSUMER',
    },
  };
}
