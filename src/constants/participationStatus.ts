/**
 * 화면 B-17(내 뭉치 참여 목록)의 상태 탭·카드 배지 표시 모델. **screen-local · 잠정**.
 *
 * 탭 라벨은 시안(B-17)의 상태 탭을 그대로 옮겼다: 전체 / 모이는 중 / 배정완료 / 확인필요 / 완료.
 *
 * ⚠️ 백엔드 상태 축과의 매핑은 아직 확정 전이다. 시안 탭은 실제로는 서로 다른 축에 걸쳐 있을 수 있다.
 *    (참고: constants/demandBoardStatus.ts) 여기서는 화면이 필터·배지를 그리기 위한 참조 모델만 둔다.
 *    BE 규격이 확정되면 이 파일에서 변환하고, 카드/탭 계약은 그대로 둔다.
 *
 * badgeClass는 썸네일 위 오버레이 배지 색이다(bg + text). 시안 색을 의미에 맞는 시맨틱 토큰으로
 * 근사했다 — 컴포넌트에서 primitive 직접 참조를 금지하는 디자인 컨벤션(.agents/design-convention)에
 * 맞추기 위함이며, 이로써 모드 전환도 배지에 함께 적용된다. 배정완료(원 시안 purple 계열)는 대응하는
 * 시맨틱 토큰이 아직 없어 가장 가까운 visibility(정보성 파랑)로 둔다 — purple 시맨틱이 추가되면 교체한다.
 * 상태별 색이 확정되면 이 표 한 곳만 고친다.
 */

export interface ParticipationStatusMeta {
  /** 상태 탭 라벨('전체' 제외). */
  readonly tabLabel: string;
  /** 썸네일 오버레이 배지 문구. */
  readonly badgeLabel: string;
  /** 그 탭이 비었을 때의 안내 문구. 시안 B-17 각 탭 빈 상태 카피. */
  readonly emptyTitle: string;
  /** 오버레이 배지 색 클래스(bg + text). */
  readonly badgeClass: string;
  /**
   * 카드 가격 섹션의 라벨. 낙찰 전(모이는 중·배정완료·확인필요)은 '희망가격대',
   * 낙찰이 종결된 '완료'만 '낙찰가'로 표기한다(B-17 시안 확정, 2026-09-16).
   */
  readonly priceHeading: string;
}

export const PARTICIPATION_STATUS = {
  /** 모이는 중 — 응찰 접수·참여자 모집. */
  GATHERING: {
    tabLabel: '모이는 중',
    badgeLabel: '모이는 중',
    emptyTitle: '모이는 중인 수요가 없어요',
    badgeClass: 'bg-surface-brand text-content-oncolor',
    priceHeading: '희망가격대',
  },
  /** 배정완료 — 낙찰 배정됨(참여자 낙찰 취소 가능). */
  ALLOCATED: {
    tabLabel: '배정완료',
    badgeLabel: '배정완료',
    emptyTitle: '배정된 내 물품이 없어요',
    badgeClass: 'bg-surface-visibility text-content-visibility',
    priceHeading: '희망가격대',
  },
  /** 확인필요 — 참여자 조치 필요(대체상품 확인 등 → B-16). */
  ACTION_REQUIRED: {
    tabLabel: '확인필요',
    badgeLabel: '확인 필요',
    emptyTitle: '확인이 필요한 내역이 없어요',
    badgeClass: 'bg-surface-danger text-content-oncolor',
    priceHeading: '희망가격대',
  },
  /** 완료 — 참여 종결. */
  DONE: {
    tabLabel: '완료',
    badgeLabel: '완료',
    emptyTitle: '완료된 참여가 없어요',
    badgeClass: 'bg-surface-tertiary text-content-tertiary',
    priceHeading: '낙찰가',
  },
} as const satisfies Record<string, ParticipationStatusMeta>;

/** 참여 상태 코드 유니온. 레지스트리 키에서 파생한다. */
export type ParticipationStatus = keyof typeof PARTICIPATION_STATUS;

/** 상태 코드로 배지·탭 메타를 얻는다. */
export function getParticipationStatusMeta(status: ParticipationStatus): ParticipationStatusMeta {
  return PARTICIPATION_STATUS[status];
}

/** '전체' 탭 키. 상태 코드와 겹치지 않는 별도 값. */
export const PARTICIPATION_TAB_ALL = 'ALL' as const;

/** 상태 탭 키. '전체' + 각 상태. */
export type ParticipationTab = typeof PARTICIPATION_TAB_ALL | ParticipationStatus;

/**
 * 상태 탭 목록. 순서는 시안(B-17) 탭 순서를 그대로 따른다.
 */
export const PARTICIPATION_TABS: readonly { key: ParticipationTab; label: string }[] = [
  { key: PARTICIPATION_TAB_ALL, label: '전체' },
  { key: 'GATHERING', label: PARTICIPATION_STATUS.GATHERING.tabLabel },
  { key: 'ALLOCATED', label: PARTICIPATION_STATUS.ALLOCATED.tabLabel },
  { key: 'ACTION_REQUIRED', label: PARTICIPATION_STATUS.ACTION_REQUIRED.tabLabel },
  { key: 'DONE', label: PARTICIPATION_STATUS.DONE.tabLabel },
];
