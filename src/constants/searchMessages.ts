/**
 * 상품 도감 검색(B-05 검색 입력 · B-06 검색 결과) 문구. 시안 `1153:72646`·`1153:72821`에서
 * 읽은 그대로다.
 *
 * ⚠️ 시안이 같은 뜻을 다르게 적은 곳이 두 군데 있다. 문구는 디자인 결정이라 임의로 통일하지 않고
 *    시안 그대로 둔다(디자인 확인 대상).
 *      - 필터 칩은 `마감 임박`(공백 있음), 카드 상태 배지는 `마감임박`(공백 없음)
 *      - 카드 배지가 `수요없음`(1153:72829)과 `수요 없음`(1153:72830·72831)으로 갈린다.
 *        더 많이 쓰인 `수요 없음`을 택했다.
 */

/** B-05 앱바 제목. */
export const SEARCH_TITLE = '검색하기';

/** B-05·홈 검색바 placeholder. 홈(HOME_SEARCH_PLACEHOLDER)과 같은 문구지만 화면이 달라 따로 둔다. */
export const SEARCH_PLACEHOLDER = '검색어를 입력해주세요.';

/** 검색바의 접근성 이름. 시안에는 라벨이 없어 화면 밖 텍스트로만 준다. */
export const SEARCH_INPUT_LABEL = '상품 검색';

/* ── 최근 검색어 ── */

export const RECENT_SEARCHES = {
  title: '최근 검색어',
  clearAll: '전체삭제',
  /** 개별 삭제 버튼의 접근성 이름. 시안에는 아이콘만 있다. */
  removeLabel: (keyword: string) => `${keyword} 삭제`,
} as const;

/* ── B-06 필터 ── */

/**
 * 필터 칩. 순서·문구는 시안 `818:10099` 그대로다.
 *
 * ⚠️ 세 칩이 같은 축이 아니다.
 *    - `모집중`은 수요보드 상태 축이다. 다만 `DEMAND_BOARD_STATUS`의 라벨은 `모이는 중`
 *      (GB_GATHERING)이라 시안 문구와 다르다. 같은 것을 가리키는지 확인 대상이다.
 *    - `마감 임박`은 상태가 아니라 **남은 시간 파생 표기**다(BR-B17-01-13:
 *      `IMMINENT_THRESHOLD_HOURS` 미만이면 '마감 임박'으로 강조). 상태 축과 시간 축이 한 줄에
 *      섞여 있으므로 `모집중`과 `마감 임박`은 배타적이지 않다.
 *    어느 쪽이든 검색 응답에 수요보드 정보가 없어 지금은 실제로 목록을 거르지 못한다.
 */
export const SEARCH_FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'gathering', label: '모집중' },
  { key: 'closing', label: '마감 임박' },
] as const;

/** 필터 그룹의 접근성 이름. */
export const SEARCH_FILTER_GROUP_LABEL = '검색 결과 필터';

/* ── B-06 결과 카드 ── */

export const SEARCH_RESULT_CARD = {
  /** 마감 배지. 시안은 `마감 `(회색) + `D-1`(코랄)로 색을 나눠 쓴다. */
  deadlinePrefix: '마감 ',
  dday: (days: number) => `D-${days}`,
  /** 진행 중인 수요가 없는 상품의 배지. */
  noDemand: '수요 없음',
  /**
   * 모이는 중인 수요보드가 있는 상품의 배지. 시안에 없는 문구로, 9/25 PM 공지(P1 범위)가 정했다.
   * P1에서는 이 배지가 마감 D-day 배지 자리를 대신한다.
   */
  demandCount: (count: number) => `${count}개 모집중`,
  /** 상태 배지. 시안 `badge` 컴포넌트. */
  gathering: '모집중',
  closing: '마감임박',
  quickDeals: (count: number) => `진행중인 뭉치 퀵 참여 ${count}건`,
  participants: (count: number) => `${count.toLocaleString('ko-KR')}명 참여`,
} as const;

/* ── 상태 화면 ── */

/**
 * 검색 결과 0건. 시안 `1153:72790`(B-06 - empty)의 `complete-img-text-button` 그대로다.
 *
 * ⚠️ `actionLabel`의 행선지가 정해지지 않았다. 문구는 '뭉치 참여하기'인데 본문은 '원하는 상품을
 *    직접 등록해보세요'라 상품 직접 추가(B-10, Full)를 가리키는 것처럼 읽힌다. 어느 쪽이든 지금
 *    누르면 '준비 중' 토스트다(시안 `1153:72796`도 이 버튼에 미구현 토스트를 그려 뒀다).
 */
export const SEARCH_EMPTY = {
  title: '찾는 상품이 없어요...',
  /** 시안이 두 줄로 끊어 놓았으므로 줄 단위로 둔다. */
  description: ['검색어를 바꿔 다시 찾아보거나,', '원하는 상품을 직접 등록해보세요.'],
  actionLabel: '뭉치 참여하기',
} as const;

/** 조회 실패. 시안이 없어 공용 ErrorScreen 문구 규칙을 따른다. */
export const SEARCH_ERROR_DESCRIPTION = [
  '검색 결과를 불러오지 못했어요.',
  '잠시 후 다시 시도해주세요.',
] as const;
