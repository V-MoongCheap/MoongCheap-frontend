import { describe, expect, it } from 'vitest';

import { AUTH_ERROR_MESSAGES } from '@/constants/authMessages';
import { loginSchema, signupIdSchema, signupPasswordSchema } from '@/schemas/auth';

/** 실패한 검증의 첫 메시지. 성공이면 undefined. */
function firstError(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.success ? undefined : result.error?.issues[0]?.message;
}

describe('loginSchema', () => {
  it('아이디 앞뒤 공백을 제거해 통과시킨다', () => {
    const result = loginSchema.safeParse({ id: '  moong  ', password: 'pw' });

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('moong');
  });

  it('공백만 입력한 아이디는 필수 오류로 막는다', () => {
    const result = loginSchema.safeParse({ id: '   ', password: 'pw' });

    expect(firstError(result)).toBe(AUTH_ERROR_MESSAGES.id.required);
  });

  it('비밀번호는 trim하지 않아 공백도 유효한 입력으로 본다', () => {
    const result = loginSchema.safeParse({ id: 'moong', password: ' ' });

    expect(result.success).toBe(true);
    expect(result.data?.password).toBe(' ');
  });

  it('빈 비밀번호는 필수 오류로 막는다', () => {
    const result = loginSchema.safeParse({ id: 'moong', password: '' });

    expect(firstError(result)).toBe(AUTH_ERROR_MESSAGES.password.required);
  });
});

describe('signupIdSchema', () => {
  it('영문·숫자 조합은 통과한다', () => {
    expect(signupIdSchema.safeParse('Moong123').success).toBe(true);
  });

  it.each(['moong!', 'moong cheap', '뭉치'])('영문·숫자 외 문자(%s)는 형식 오류다', (id) => {
    expect(firstError(signupIdSchema.safeParse(id))).toBe(AUTH_ERROR_MESSAGES.id.format);
  });
});

describe('signupPasswordSchema', () => {
  it('대문자·소문자·숫자·특수문자를 모두 포함한 8자는 통과한다', () => {
    expect(signupPasswordSchema.safeParse('Abcdef1!').success).toBe(true);
  });

  it('16자는 통과하고 17자는 막는다', () => {
    expect(signupPasswordSchema.safeParse('Abcdefgh1234567!').success).toBe(true);
    expect(signupPasswordSchema.safeParse('Abcdefgh12345678!').success).toBe(false);
  });

  it('7자는 막는다', () => {
    expect(firstError(signupPasswordSchema.safeParse('Abcde1!'))).toBe(
      AUTH_ERROR_MESSAGES.password.rule,
    );
  });

  it.each([
    ['대문자 없음', 'abcdef1!'],
    ['소문자 없음', 'ABCDEF1!'],
    ['숫자 없음', 'Abcdefg!'],
    ['특수문자 없음', 'Abcdefg1'],
    ['공백 포함', 'Abc def1!'],
  ])('%s이면 막는다', (_, password) => {
    expect(firstError(signupPasswordSchema.safeParse(password))).toBe(
      AUTH_ERROR_MESSAGES.password.rule,
    );
  });
});
