/**
 * 카운트다운 표기 공통 유틸. `lib/formatPrice.ts`와 같은 자리(화면 무관 순수 포맷터)다.
 *
 * 홈 카드 카운트다운(`CountdownTimer`)과 참여 목록 카드(B-17)의 마감 임박 표기가 같은 모양을 쓰도록
 * 한곳에 둔다.
 */

/** 남은 밀리초 → `HH:MM:SS`. 지난 시각은 `00:00:00`. */
export function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
}
