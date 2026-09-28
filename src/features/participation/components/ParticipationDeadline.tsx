'use client';

import { useEffect, useState } from 'react';

import { IMMINENT_THRESHOLD_HOURS } from '@/constants/businessRules';
import { PARTICIPATION_DEADLINE } from '@/constants/participationStatus';
import { computeDday } from '@/lib/demandApi';
import { formatRemaining } from '@/lib/formatCountdown';

// B-17 참여 카드의 마감 표기. 문구 규칙은 `PARTICIPATION_DEADLINE` 주석 참고.
//
// 시각은 서버 재조회 없이 클라이언트 시계로만 흘린다(명세 '0 도달 시 마감 표시, 서버 재조회 없음').
// 12시간 밖이면 1초마다 다시 그릴 이유가 없어 카운트다운 구간에 들어가는 순간에만 한 번 깨운다.

const IMMINENT_WINDOW_MS = IMMINENT_THRESHOLD_HOURS * 60 * 60 * 1000;

/** setTimeout 최대 지연(약 24.8일). 이보다 먼 마감은 깨우지 않는다(그 사이 목록을 다시 받는다). */
const MAX_TIMEOUT_MS = 2_147_483_647;

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

  // 구간(phase)이 바뀔 때만 타이머를 다시 건다. 카운트다운 중엔 인터벌 하나로 매초 갱신한다.
  useEffect(() => {
    if (phase === 'imminent') {
      const timer = window.setInterval(() => setNow(Date.now()), 1000);
      return () => window.clearInterval(timer);
    }
    if (phase === 'far') {
      const untilWindow = end - Date.now() - IMMINENT_WINDOW_MS + 1;
      if (untilWindow <= MAX_TIMEOUT_MS) {
        const timer = window.setTimeout(() => setNow(Date.now()), Math.max(0, untilWindow));
        return () => window.clearTimeout(timer);
      }
    }
    return undefined;
  }, [end, phase]);

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
