/**
 * B-08 상품 상세 화면 타입.
 *
 * 백엔드 도메인 A의 상품 상세 엔드포인트/DTO 규격이 아직 없다(홈 `ProductCatalogSummaryDto`는
 * `{ id, name, thumbnailUrl }` 3개뿐). 시안을 채우는 데 필요한 값을 목 전용으로 얹었고, 연동
 * 시점에 서버 규격으로 대체한다. 이름은 확정 규격이 없어 화면 의미 기준으로 붙였다.
 */

import type { ProductCatalogSummary } from '@/types/home';

/**
 * 상품 상세에서 노출되는 "진행중인 뭉치 퀵 참여" 딜 한 건. 시안 컴포넌트 `demand-card`.
 * 마감 표시는 홈 카드와 같은 모델(D-day 또는 실시간 카운트다운)을 쓴다.
 */
export interface ProductQuickDeal {
  id: string;
  /** `D-2` 뱃지로 그릴 남은 일수. */
  dday?: number;
  /** `00:09:23` 실시간 카운트다운. ISO 문자열로 두고 화면에서 계산한다. */
  deadline?: string;
  /** 현재 참여 인원. 시안 "1,200명 참여". */
  participantCount: number;
  /** 희망 가격대 라벨. 시안 "1만원 이하". */
  desiredPriceLabel: string;
  /** 응찰한 뭉치셀러 수. 시안 "뭉셀러 3명". */
  sellerCount: number;
}

/**
 * 상품설명 하단 아코디언 한 섹션(상품 상세정보 · 배송정보 · 교환/환불/반품 정보).
 * 본문 내용은 상품/정책 데이터라 규격·콘텐츠가 확정되면 서버 값으로 대체한다.
 */
export interface ProductInfoSection {
  id: string;
  title: string;
  body: string;
}

/** B-08 상품 상세. `ProductCatalogSummary`(id·name·thumbnailUrl)에 시안 표시값을 얹는다.
 *
 * 백엔드 `GET /api/product-catalog/{id}`(도메인 A)가 주는 값(name·thumbnailUrl·specSummary·
 * description·listPrice)은 연동 시 실데이터로 덮인다([[lib/productApi]]). 브랜드·열람수·비슷한상품은
 * 백엔드에 필드가 없어 mock에만 있고, 실데이터를 덮을 때 비운다(다른 상품의 mock 값이 보이지
 * 않게, #173). 퀵참여딜은 실데이터일 때 수요보드 조회가 따로 채운다([[lib/demandBoardApi]]). */
export interface ProductDetail extends ProductCatalogSummary {
  /** 브랜드명. 시안 상품 이미지 아래 브랜드 행. 없으면 브랜드 표시를 숨긴다. (mock 전용, BE 미제공) */
  brandName?: string;
  /** 브랜드 아바타. 없으면 회색 원 placeholder. (mock — BE 미제공) */
  brandLogoUrl?: string;
  /** 규격/용량 부제. 시안 "프로바이오틱스 80포 160g". BE `specSummary`와 대응. 없으면 숨긴다. */
  spec?: string;
  /** 정가. BE `listPrice`. 시안 B-08엔 상품가 표시 자리가 없어 아직 화면엔 안 쓴다. */
  listPrice?: number;
  /** 상품설명 본문(텍스트). BE `description`(TEXT). 없으면 상품설명 섹션을 숨긴다. */
  description?: string;
  /** 실시간 열람 인원. 시안 "현재 231명이 보고 있어요!". 없으면 배지를 숨긴다. (mock 전용, BE 미제공) */
  viewingCount?: number;
  /** "비슷한 상품" 칩에 겹쳐 보이는 미리보기 썸네일(최대 2장 노출). (mock — BE 미제공) */
  similarThumbnails?: readonly string[];
  /**
   * 진행중인 뭉치 퀵 참여 딜. 빈 배열이면 "0건". mock 상품일 때만 화면이 이 값을 쓴다.
   * 실데이터 상품은 `useCatalogQuickDeals`(수요보드 조회)의 결과를 그린다.
   */
  quickDeals: readonly ProductQuickDeal[];
  /** 아코디언 정보 섹션들. (mock — BE 미제공) */
  infoSections: readonly ProductInfoSection[];
}
