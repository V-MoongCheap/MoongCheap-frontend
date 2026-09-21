/**
 * 수요(Demand) 백엔드 DTO.
 *
 * `types/api/order.ts`와 같은 역할이다. 여기는 **백엔드 응답을 그대로 옮긴 것**이고, 화면 타입
 * (`types/participation.ts`)으로의 변환은 `lib/demandApi.ts`가 맡는다.
 *
 * 출처: 백엔드 develop 브랜치 `DemandController.read` · `DemandService.list` ·
 * `DemandListDto`(+중첩 record) · `DemandStatus` · `DemandQueryRepositoryImpl`(2026-09-17 확인).
 *
 * ⚠️ 참여 목록 API(`GET /api/members/me/demand`)는 백엔드 develop 브랜치에만 있다. 로컬 백엔드를
 *    develop으로 띄워야 한다(`lib/orderApi.ts`와 같은 상황).
 */

/**
 * 백엔드 수요 상태 9종(`DemandStatus`). 화면은 이 중 5종만 탭에 매핑하고, 터미널 4종
 * (`FAILED`·`CANCELED`·`EXPIRED`·`DELETED`)은 조회 대상에서 제외한다(`useMyDemands` 매핑 표).
 */
export type DemandStatusDto =
  | 'UNASSIGNED'
  | 'SUBSTITUTE_OFFERED'
  | 'ASSIGNED'
  | 'PAYMENT_PENDING'
  | 'CLOSED'
  | 'FAILED'
  | 'CANCELED'
  | 'EXPIRED'
  | 'DELETED';

/**
 * 상품 카탈로그 요약(`DemandListDto.CatalogDto`). 수요 자체의 카탈로그와, 대체 오퍼 시
 * `demandBoard.catalog`(대체 상품) 두 자리에 같은 모양으로 쓰인다.
 *
 * ⚠️ record 필드는 원시형이지만 JSON에서는 값이 없을 때 null이 올 수 있어 nullable로 둔다
 *    (`Integer`·`String` 컬럼). `name`만 INNER JOIN 대상이라 항상 채워진다.
 */
export interface CatalogDto {
  id: number;
  name: string;
  specSummary: string | null;
  thumbnailUrl: string | null;
  listPrice: number | null;
}

/**
 * 수요보드(`DemandListDto.DemandBoardDto`). 수요가 보드에 배정되기 전(방금 등록한 UNASSIGNED)
 * 에는 `demand_board_id`가 없어 **item 전체가 null**이다(`DemandQueryRepositoryImpl` LEFT JOIN).
 *
 * `catalog`(대체 상품)는 수요 상태가 `SUBSTITUTE_OFFERED`일 때만 조인되어 채워진다.
 */
export interface DemandBoardDto {
  id: number;
  participantCount: number;
  priceMin: number | null;
  priceMax: number | null;
  saleEndAt: string | null;
  catalog: CatalogDto | null;
}

/**
 * 낙찰된 상품(`DemandListDto.ProductDto`). **낙찰 이후 상태(`PAYMENT_PENDING`·`CLOSED`)에서만** 채워지고,
 * 그 전(`UNASSIGNED`·`SUBSTITUTE_OFFERED`·`ASSIGNED`)에는 null이다(백엔드 develop, 2026-09-21 추가).
 *
 * `unitPrice`가 **확정 낙찰 단가(원)** — 완료 카드 '낙찰가' 표기의 출처다. `id`는 낙찰된 상품 id.
 */
export interface ProductDto {
  id: number;
  unitPrice: number;
}

/** 참여 목록의 한 건(`DemandListDto.DemandItemDto`). */
export interface DemandItemDto {
  id: number;
  status: DemandStatusDto;
  desiredPriceMin: number | null;
  desiredPriceMax: number | null;
  /** 낙찰 상품(낙찰 이후 상태에서만, 그 전엔 null). 완료 카드 낙찰가 출처. */
  product: ProductDto | null;
  /** 수요 마감 시각(`LocalDateTime`, 등록 시 now+2일). 항상 채워진다. D-day 산출 기준. */
  desireEndAt: string | null;
  quantity: number | null;
  extraRequirement: string | null;
  isSubstitutable: boolean;
  /** 수요 접수 시각(`LocalDateTime`). 목록의 날짜 그룹 헤더 기준. */
  createdAt: string | null;
  catalog: CatalogDto;
  /** 보드 미배정 시 null(위 주석). */
  demandBoard: DemandBoardDto | null;
}

/**
 * `GET /api/members/me/demand` 응답(`DemandListDto`).
 *
 * ⚠️ 주문의 스프링 `PageDto`와 다른 **커스텀 래퍼**다. `size`는 이번 페이지의 건수(전체 건수 아님),
 *    `hasNext`는 서버가 pageSize+1을 조회해 판정한다. `page`는 0부터.
 */
export interface DemandListDto {
  demands: DemandItemDto[];
  size: number;
  hasNext: boolean;
  page: number;
}
