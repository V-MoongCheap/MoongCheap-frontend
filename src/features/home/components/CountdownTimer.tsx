'use client';

import { useEffect, useState } from 'react';

import { formatRemaining } from '@/lib/formatCountdown';

// 마감까지 남은 시간. 시안이 `03:09:12`(HH:MM:SS)로 그린다.
//
// 서버에서 계산하면 하이드레이션 때 값이 어긋나므로 첫 렌더에서는 값을 비우고 마운트 후
// 클라이언트 시계로만 채운다.
//
// 남은 시간을 깎지 않고 매초 `Date.now()`로 다시 계산한다. 백그라운드 탭에서 setInterval이
// 스로틀돼도 복귀 시 값이 저절로 맞는다.

interface CountdownTimerProps {
  /** 마감 시각. ISO 8601 문자열. */
  deadline: string;
}

export function CountdownTimer({ deadline }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState<string | null>(null);

  useEffect(() => {
    const target = new Date(deadline).getTime();

    const tick = () => {
      setRemaining(formatRemaining(target - Date.now()));
    };

    tick();
    const timer = window.setInterval(tick, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [deadline]);

  // 마운트 전에는 같은 자릿수의 문자열을 투명하게 깔아 폭을 잡아 둔다. 빈 문자열로 두면
  // 값이 들어오는 순간 옆 배지와 텍스트가 밀린다.
  if (remaining === null) {
    return (
      <span aria-hidden className="invisible">
        00:00:00
      </span>
    );
  }

  return <span>{remaining}</span>;
}
