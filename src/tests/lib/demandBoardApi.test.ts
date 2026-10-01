import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  formatBoardPriceLabel,
  formatDemandBoardDeadline,
  isDemandBoardClosed,
  remainingUntil,
  toDemandBoardId,
} from '@/lib/demandBoardApi';

const END = '2026-09-30T18:00:00';
const END_MS = new Date(END).getTime();
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

describe('isDemandBoardClosed', () => {
  it('마감 1분 전까지는 참여를 받는다', () => {
    expect(isDemandBoardClosed(END, END_MS - MINUTE - 1)).toBe(false);
  });

  it('마감 1분 전부터 참여를 막는다(마감 직전 경합 방지)', () => {
    expect(isDemandBoardClosed(END, END_MS - MINUTE)).toBe(true);
    expect(isDemandBoardClosed(END, END_MS + HOUR)).toBe(true);
  });

  it('마감 시각이 없거나 깨졌으면 마감으로 본다', () => {
    expect(isDemandBoardClosed(undefined, END_MS - HOUR)).toBe(true);
    expect(isDemandBoardClosed('not-a-date', END_MS - HOUR)).toBe(true);
  });
});

describe('remainingUntil', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-28T10:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('1시간 미만이면 분 단위로, 올림해서 센다', () => {
    expect(remainingUntil(END, END_MS - 30 * MINUTE - 1)).toEqual({ kind: 'minutes', minutes: 31 });
  });

  it('0분은 만들지 않고 최소 1분으로 표기한다', () => {
    expect(remainingUntil(END, END_MS - 1)).toEqual({ kind: 'minutes', minutes: 1 });
    expect(remainingUntil(END, END_MS + MINUTE)).toEqual({ kind: 'minutes', minutes: 1 });
  });

  it('1시간 이상이면 달력일 기준 D-day다', () => {
    expect(remainingUntil(END, END_MS - HOUR)).toEqual({ kind: 'dday', days: 2 });
  });
});

describe('formatDemandBoardDeadline', () => {
  it('월·일·요일·오전/오후로 풀어 쓴다', () => {
    expect(formatDemandBoardDeadline('2026-09-30T12:49:05')).toBe('9월 30일 (수) 오후 12:49');
    expect(formatDemandBoardDeadline('2026-10-04T09:05:00')).toBe('10월 4일 (일) 오전 9:05');
  });

  it('자정은 오전 12시로 쓴다', () => {
    expect(formatDemandBoardDeadline('2026-10-01T00:30:00')).toBe('10월 1일 (목) 오전 12:30');
  });

  it('모양이 다르면 받은 값을 그대로 돌려준다', () => {
    expect(formatDemandBoardDeadline('곧 마감')).toBe('곧 마감');
  });
});

describe('formatBoardPriceLabel', () => {
  it('접수 구간 하나와 같으면 그 구간 라벨을 쓴다', () => {
    expect(formatBoardPriceLabel(5_001, 10_000)).toBe('1만원 이하');
  });

  it('여러 구간에 걸치면 만원 단위로 내린 범위를 쓴다', () => {
    expect(formatBoardPriceLabel(20_001, 100_000)).toBe('2만~10만원');
  });

  it('1만원 미만은 천원 단위로 내린다', () => {
    expect(formatBoardPriceLabel(3_000, 20_000)).toBe('3천~2만원');
  });

  it('내린 두 값이 같으면 하나만 쓴다', () => {
    expect(formatBoardPriceLabel(20_001, 20_500)).toBe('2만원');
  });

  it('값이 없으면 빈 문자열이다', () => {
    expect(formatBoardPriceLabel(null, 10_000)).toBe('');
  });
});

describe('toDemandBoardId', () => {
  it('숫자 문자열만 백엔드 id로 바꾼다', () => {
    expect(toDemandBoardId('207')).toBe(207);
  });

  it.each(['abc', '-1', '1.5', '', '9007199254740993'])('%s는 null이다', (id) => {
    expect(toDemandBoardId(id)).toBeNull();
  });
});
