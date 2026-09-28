'use client';

import { useEffect, useState } from 'react';

import { IMMINENT_THRESHOLD_HOURS } from '@/constants/businessRules';
import { PARTICIPATION_DEADLINE } from '@/constants/participationStatus';
import { computeDday } from '@/lib/demandApi';
import { formatRemaining } from '@/lib/formatCountdown';

// B-17 참여 카드의 마감 표기. 문구 규칙은 `PARTICIPATION_DEADLINE` 주석 참고.
//
// 시각은 서버 재조회 없이 클라이언트 시계로만 흘린다(명세 '0 도달 시 마감 표시, 서버 재조회 없음').
// 12시간 밖이면 1초마다 다시 그릴 이유가 없어, 카운트다운 구간에 들어가는 순간과 D-N이 바뀌는
// 로컬 자정 중 이른 쪽에만 한 번씩 깨운다.

const IMMINENT_WINDOW_MS = IMMINENT_THRESHOLD_HOURS * 60 * 60 * 1000;

/** 다음 로컬 자정까지 남은 밀리초. D-N(`computeDday`)이 로컬 날짜 기준이라 이때 한 번 다시 그린다. */
function msUntilNextMidnight(now: number): number {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now;
}

type Phase = 'invalid' | 'closed' | 'imminent' | 'far';

function toPhase(remaining: number): Phase {
  if (Number.isNaN(remaining)) {
    return 'invalid';
  }
  if (remaining <= 0) {
    return 'closed';
  }
  return remaining < IMMINENT_WINDOW_MS ? 'imminent' : 'far';
}

interface ParticipationDeadlineProps {
  /** 마감 시각(ISO, 시간대 없음). */
  deadline: string;
  /** 낙찰 전(`ASSIGNED`)인지. 마감 뒤 '판정 중' 표기에 쓴다. */
  isAwaitingAward: boolean;
}

export function ParticipationDeadline({ deadline, isAwaitingAward }: ParticipationDeadlineProps) {
  const end = new Date(deadline).getTime();
  const [now, setNow] = useState(() => Date.now());
  const remaining = end - now;
  const phase = toPhase(remaining);

  // 카운트다운 중엔 인터벌 하나로 매초 갱신한다. 구간이 바뀔 때만 인터벌을 다시 건다.
  useEffect(() => {
    if (phase !== 'imminent') {
      return undefined;
    }
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  // 12시간 밖이면 다음 로컬 자정(D-N 변경)과 카운트다운 구간 진입 중 이른 쪽에 깨운다. 깨어나 `now`가
  // 바뀌면 다음 자정을 다시 예약하므로 며칠 켜 둬도 D-N이 날마다 줄어든다.
  useEffect(() => {
    if (phase !== 'far') {
      return undefined;
    }
    const untilWindow = end - now - IMMINENT_WINDOW_MS + 1;
    const delay = Math.max(0, Math.min(untilWindow, msUntilNextMidnight(now)));
    const timer = window.setTimeout(() => setNow(Date.now()), delay);
    return () => window.clearTimeout(timer);
  }, [end, now, phase]);

  if (phase === 'invalid') {
    return null;
  }

  if (phase === 'closed') {
    return (
      <span className="text-label-13 text-content-tertiary whitespace-nowrap">
        {isAwaitingAward ? PARTICIPATION_DEADLINE.awarding : PARTICIPATION_DEADLINE.closed}
      </span>
    );
  }

  if (phase === 'imminent') {
    return (
      <span className="text-label-13 text-content-error whitespace-nowrap">
        {PARTICIPATION_DEADLINE.imminent}{' '}
        <span className="tabular-nums">{formatRemaining(remaining)}</span>
      </span>
    );
  }

  return (
    <span className="text-label-13 text-content-error whitespace-nowrap">
      {PARTICIPATION_DEADLINE.dday(computeDday(deadline))}
    </span>
  );
}
