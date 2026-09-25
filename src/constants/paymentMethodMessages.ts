/**
 * 결제수단 관리(B-14) 조회·기본 변경 문구. 출처: 기능명세 FN-B14-01(화면상태·예외처리·완료조건).
 *
 * 로딩·실패·변경 중 상태는 시안이 없고 명세가 '디자인 필요'로 남겨 둔 곳이다. 문구만 명세에서
 * 옮겼고, 최종 카피가 나오면 여기만 손본다(`addressActions.ts`와 같은 방침).
 */
export const PAYMENT_METHOD_MESSAGES = {
  /** 목록 조회 실패. '다시 시도' 버튼과 함께 목록 자리에 노출한다. */
  loadFailed: '결제수단을 불러오지 못했어요',
  /** 기본 변경 CTA. BR-B14-01-10. */
  changeDefaultCta: '기본결제수단 바꾸기',
  /** 기본 변경 요청 중 CTA. BR-B14-01-10. */
  changingDefaultCta: '변경 중...',
  /** 기본 변경 성공 토스트. */
  defaultChanged: '기본결제수단이 변경되었어요',
  /** 기본 변경 실패 토스트. */
  changeDefaultFailed: '결제수단을 변경하지 못했어요. 다시 시도해주세요',
} as const;
