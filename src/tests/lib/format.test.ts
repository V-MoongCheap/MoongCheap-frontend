import { describe, expect, it } from 'vitest';

import { formatRemaining } from '@/lib/formatCountdown';
import { formatPhone } from '@/lib/formatPhone';
import { formatWon } from '@/lib/formatPrice';

describe('formatWon', () => {
  it('천 단위로 끊고 원을 붙인다', () => {
    expect(formatWon(27_000)).toBe('27,000원');
    expect(formatWon(0)).toBe('0원');
  });
});

describe('formatPhone', () => {
  it('11자리 휴대폰 번호를 3-4-4로 끊는다', () => {
    expect(formatPhone('01012345678')).toBe('010-1234-5678');
  });

  it('10자리 번호는 3-3-4로 끊는다', () => {
    expect(formatPhone('0111234567')).toBe('011-123-4567');
  });

  it('형식을 알 수 없으면 원본을 그대로 돌려준다', () => {
    expect(formatPhone('02-123-4567')).toBe('02-123-4567');
  });
});

describe('formatRemaining', () => {
  it('남은 밀리초를 HH:MM:SS로 바꾼다', () => {
    expect(formatRemaining((11 * 3600 + 5 * 60 + 9) * 1000)).toBe('11:05:09');
  });

  it('초 미만은 버린다', () => {
    expect(formatRemaining(1_999)).toBe('00:00:01');
  });

  it('지난 시각은 00:00:00이다', () => {
    expect(formatRemaining(-5_000)).toBe('00:00:00');
  });
});
