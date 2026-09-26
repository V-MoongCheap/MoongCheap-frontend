/**
 * 수요 상세(B-12)·퀵 참여(FN-B12-02) 문구.
 *
 * 두 화면 모두 디자인 시안이 없다(9/23 결제 범위 공지 이후 '시안 없이 명세 기준으로 만든다'고 정했다).
 * 문구 출처는 기능명세서 MC-B12-01·MC-B12-02다. 명세에도 문장이 없어 명세의 설명을 문장으로 옮긴 것은
 * 항목마다 `판단`으로 적었다. 시안이 나오면 이 파일만 바꾼다.
 */

/** 수요 상세(MC-B12-01). */
export const DEMAND_BOARD_DETAIL = {
  /** 앱바 제목. 명세 기능명. */
  appBarTitle: '수요 상세',
  /** 명세 구성 요소 '확정 수요 인원 (n명)'. */
  participantsLabel: '확정 수요 인원',
  participants: (count: number) => `${count.toLocaleString('ko-KR')}명`,
  /**
   * 명세 구성 요소 '남은 시간 (D-n · 마감 일시. 1시간 미만이면 분 단위 표기)'.
   * 판단: 한 줄에 붙이면 읽기 어려워 남은 시간과 마감 일시를 두 줄로 나눴다.
   */
  remainingLabel: '남은 시간',
  deadlineAtLabel: '마감 일시',
  /** 판단: 명세 '1시간 미만이면 분 단위 표기'를 `12분 남음`으로 적는다. */
  minutesLeft: (minutes: number) => `${minutes}분 남음`,
  /** 명세 구성 요소 '희망 가격대 표기'. */
  priceLabel: '희망 가격대',
  /** 명세 예시 '5천원~1만원대에서 모이는 중'. */
  gatheringAt: (priceLabel: string) => `${priceLabel}에서 모이는 중`,
  /** 명세 비즈니스 규칙 예시 '판매자 3곳이 참여 중'. 0곳이면 줄을 숨긴다(명세 '응찰 0건: 건수 영역 미노출'). */
  sellers: (count: number) => `판매자 ${count}곳이 참여 중`,
  /** 하단 CTA. 명세 구성 요소. */
  join: '함께 신청하기',
  /** 이미 참여한 유저의 CTA. 명세 비즈니스 규칙 문구 그대로. */
  participating: '참여 중 · 내 대기에서 확인',
  /** 판단: 명세 화면 상태 '마감: 참여 버튼 비활성 + 마감된 공구 안내'를 비활성 버튼 문구로 쓴다. */
  closed: '마감된 공구예요',
  /** 명세 예외처리 '종료·삭제된 수요보드로 진입 → 종료된 공구예요 안내 + 홈 복귀'. */
  notFound: '종료된 공구예요',
} as const;

/** 퀵 참여(MC-B12-02). */
export const QUICK_JOIN = {
  /** 앱바 제목. 명세 기능명 '수요 참여'. */
  appBarTitle: '수요 참여',
  /** 판단: 명세 구성 요소 '수요보드 조건 요약'의 섹션 제목. */
  conditionTitle: '참여 조건',
  /** 판단: 명세 '희망 가격대·마감일 — 변경 불가 표기'를 안내문으로 쓴다. */
  conditionNote: '희망 가격대와 마감일은 수요보드 조건을 따라요',
  deadlineLabel: '마감일',
  /** 수량 행 라벨. 수요 등록 화면과 같은 문구. */
  quantityLabel: '수량',
  /** 하단 버튼. 명세 구성 요소 '참여 확정 버튼'. */
  submit: '참여 확정',
  /** 판단: 명세 완료 기준 '접수 완료 안내'의 문구가 없어 수요 등록 완료 문구의 뒷부분을 따랐다. */
  submitSuccess: '참여 완료! 내 대기에서 확인할 수 있어요',
  /** 명세 예외처리 '함께 신청하기 탭 시점에 이미 마감 → 방금 마감된 공구예요 안내'. 제출 시점 마감에도 쓴다. */
  closedJustNow: '방금 마감된 공구예요',
} as const;

/** 섹션 제목 id. `DemandFormSection`이 제목에 붙인다. */
export const QUICK_JOIN_SECTION_ID = 'quick-join-condition';
