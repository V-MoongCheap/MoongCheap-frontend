/**
 * 금액 표기 공통 유틸. `lib/formatPhone.ts`와 같은 자리(화면 무관 순수 포맷터)다.
 *
 * 한국 로케일 천단위 구분 + '원'. 낙찰 결과(B-19)·참여 목록(B-17) 등 원화 금액을 보여 주는 곳이
 * 같은 표기를 쓰도록 한곳에 둔다.
 */
export function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}
