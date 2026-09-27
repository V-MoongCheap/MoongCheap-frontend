/**
 * B-08 상품 상세 화면 문구. 시안(node 1153:72748 / 1153:73735)에서 읽은 그대로다.
 *
 * ⚠️ 9/4 디자인 결정 "UI의 `수요`·`공구`를 `뭉치`로 통일"에 따라 시안도 "뭉치 퀵 참여"·
 * "뭉치 참여하기"로 쓴다. 문구가 바뀌면 이 파일만 고친다.
 */

export const PRODUCT_DETAIL = {
  /**
   * 실시간 열람 배지. 가운데 인원 수만 코랄(content/brand)로 강조돼 세 조각으로 나눠 둔다.
   * 예: "현재 " + "231명" + "이 보고 있어요!".
   */
  viewingPrefix: '현재 ',
  viewingCount: (count: number) => `${count.toLocaleString('ko-KR')}명`,
  viewingSuffix: '이 보고 있어요!',

  /** 상품 이미지 좌하단 칩. 비슷한 상품 목록(Full)으로 이동 — 아직 화면 부재. */
  similarProducts: '비슷한 상품',

  /** 진행중인 뭉치 퀵 참여 섹션 제목. "건"만 content/primary로 강조된다. */
  quickDealsLead: (count: number) => `진행중인 뭉치 퀵 참여 ${count}`,
  quickDealsUnit: '건',

  /** 딜 카드 내부 문구. */
  dealParticipants: (count: number) => `${count.toLocaleString('ko-KR')}명 참여`,
  dealSellers: (count: number) => `뭉셀러 ${count}명`,

  /** 상품설명 섹션. */
  descriptionHeading: '상품설명',
  viewMore: '자세히 보기',
  collapse: '접기',

  /** 하단 고정 CTA. 일정 타임라인 → 수요 등록(B-09)으로 이동. */
  participateCta: '뭉치 참여하기',

  /**
   * 이 상품에 이미 진행 중 수요가 있을 때의 CTA. 탭하면 내 대기(B-17)로 간다(#191·#192).
   * 참여 중·접수 완료는 명세 문구 그대로다. 수요 상세(B-12)의 참여 중 문구와 같다.
   */
  myDemandCta: {
    participating: '참여 중 · 내 대기에서 확인',
    received: '접수 완료 · 내 대기에서 확인',
    /** 판단: 대체상품 제안(`SUBSTITUTE_OFFERED`)은 명세에 문구가 없어 B-17 탭 이름을 따랐다. */
    actionRequired: '확인 필요 · 내 대기에서 확인',
  },
} as const;
