/**
 * 상품 도감 검색(B-06) 화면 타입.
 *
 * 검색 자체는 백엔드 `GET /api/products-search/search`(OpenSearch)로 실데이터를 받는다
 * ([[lib/productSearchApi]]). 다만 시안 카드가 요구하는 값 중 **수요 관련 값**
 * (마감 D-day · 모집중/마감임박 배지 · 진행중인 퀵 참여 건수 · 참여 인원 · 희망가 범위)은 검색 응답에
 * 없다. 검색 문서는 상품 도감(`ProductCatalog`)만 색인하고 수요보드를 보지 않기 때문이다.
 *
 * 그래서 카드마다 `GET /api/demand-boards/catalog/{catalogId}`를 불러 채운다(#173). **카탈로그
 * 1건당 1콜**이라 한 페이지(20장)에 최대 20번 호출한다. 검색 응답에 수요보드 요약이 얹히면 호출
 * 없이 그 값으로 바꾼다.
 */

import type { SEARCH_FILTERS } from '@/constants/searchMessages';

/** 필터 칩 키. 문구 상수에서 파생하므로 상수와 항상 일치한다. */
export type SearchFilterKey = (typeof SEARCH_FILTERS)[number]['key'];

/**
 * 검색 결과 카드 한 장.
 *
 * `id`·`name`·`spec`·`thumbnailUrl`·`listPrice`는 검색 응답 값이고, 나머지는 수요보드 조회로
 * 채운다(`SearchDemandSummary`, 검색이 실패해 목으로 떨어지면 목 값). 수요 값이 없으면 시안대로
 * '수요 없음' 카드(배지 하나 + 상품명 + 규격)로 그려진다.
 */
export interface ProductSearchResult {
  id: string;
  name: string;
  /** 규격/용량 부제. BE `specSummary`. 시안 "프로바이오틱스 80포 160g". */
  spec?: string;
  /**
   * 없거나 앱 바깥 주소면 카드가 이미지 자리를 빈 채로 둔다(시안의 이미지 영역이 흰 바탕이라
   * 배경만 남는다). 외부 주소를 거르는 이유는 [[lib/imageSource]] 참고.
   */
  thumbnailUrl?: string;
  /** 정가. BE `listPrice`. 시안 B-06엔 표시 자리가 없어 아직 화면엔 안 쓴다. */
  listPrice?: number;
  /** 가장 가까운 마감까지 남은 일수. 시안 `마감 D-1`. */
  dday?: number;
  /** 수요 상태. 없으면 '수요 없음' 카드다. */
  demandStatus?: 'gathering' | 'closing';
  /** 진행중인 뭉치 퀵 참여 건수 = 모이는 중인 수요보드 수. */
  quickDealCount?: number;
  /** 참여 인원 = 모이는 중인 수요보드들의 확정 인원 합. */
  participantCount?: number;
  /** 희망가 범위. 시안 카드에는 자리가 없고 명세(TC-B06-01-02)가 요구한다. 예: `2만~10만원`. */
  desiredPriceLabel?: string;
}

/** 수요보드 조회로 채우는 검색 결과 카드의 수요 값([[lib/demandBoardApi]] `toSearchDemandSummary`). */
export type SearchDemandSummary = Pick<
  ProductSearchResult,
  'dday' | 'demandStatus' | 'quickDealCount' | 'participantCount' | 'desiredPriceLabel'
>;
