import { IMMINENT_THRESHOLD_HOURS, PRICE_BANDS } from '@/constants/businessRules';
import type { CatalogDemandBoardCardDto, CatalogDemandBoardListDto } from '@/types/api/demandBoard';
import type { ProductQuickDeal } from '@/types/product';
import type { SearchDemandSummary } from '@/types/search';

import { apiFetch } from './api';
import { computeDday } from './demandApi';

/**
 * 수요보드 백엔드 호출.
 *
 * 화면은 백엔드 DTO를 모르고 `ProductQuickDeal`(상품 상세)·`SearchDemandSummary`(검색 결과)만 안다.
 * 변환은 이 파일이 맡는다(`lib/paymentApi.ts`와 같은 규칙). 세션(SID httpOnly 쿠키)이 필요해
 * **브라우저에서만** 부른다.
 */

/**
 * 마감까지 이 시간 이하로 남은 보드는 D-day 대신 실시간 카운트다운(`HH:MM:SS`)으로 그린다.
 *
 * 명세 TC-B03-01-05(홈 카드): 마감까지 12시간 이하면 'D-n' 대신 '시:분:초'로 1초마다 줄인다.
 * '마감 임박' 기준(`IMMINENT_THRESHOLD_HOURS`, BR-B17-01-13)과 같은 12시간이다.
 */
const COUNTDOWN_WINDOW_MS = IMMINENT_THRESHOLD_HOURS * 60 * 60 * 1000;

/** 만원 단위로 내린 금액. 1만원 미만은 천원 단위로 내린다. 예: 100,000 → `10만`, 5,001 → `5천`. */
function floorToManwon(amount: number): string {
  if (amount >= 10_000) {
    return `${Math.floor(amount / 10_000)}만`;
  }
  if (amount >= 1_000) {
    return `${Math.floor(amount / 1_000)}천`;
  }
  return String(amount);
}

/**
 * 보드 희망 가격대 범위 표기. 집계값을 만원 단위로 내린다(`PRICE_BANDS` 주석의 만원 절삭 규칙).
 * 예: 20,001~100,000 → `2만~10만원`. 내린 두 값이 같으면 하나만 쓴다.
 */
function formatBoardPriceRange(min: number, max: number): string {
  const low = floorToManwon(min);
  const high = floorToManwon(max);
  return low === high ? `${high}원` : `${low}~${high}원`;
}

/**
 * 보드 희망 가격대 라벨. 수요 접수 구간 하나와 정확히 같으면 그 구간 라벨(시안 `1만원 이하`),
 * 여러 구간에 걸치면 범위(`2만~10만원`)로 쓴다. 값이 없으면 빈 문자열이다.
 */
export function formatBoardPriceLabel(min: number | null, max: number | null): string {
  if (min === null || max === null) {
    return '';
  }
  const band = PRICE_BANDS.find((b) => b.min === min && b.max === max);
  return band?.label ?? formatBoardPriceRange(min, max);
}

/** 마감 표기 값. 12시간 이하면 카운트다운, 그보다 멀면 D-day. 마감이 없거나 깨졌으면 둘 다 없다. */
function toDeadlineFields(saleEndAt: string | null): Pick<ProductQuickDeal, 'dday' | 'deadline'> {
  if (saleEndAt === null) {
    return {};
  }
  const end = new Date(saleEndAt).getTime();
  if (Number.isNaN(end)) {
    return {};
  }
  return end - Date.now() <= COUNTDOWN_WINDOW_MS
    ? { deadline: saleEndAt }
    : { dday: computeDday(saleEndAt) };
}

/** B-08 상품 상세 '진행중인 뭉치 퀵 참여' 카드로 옮긴다. 순서는 백엔드 순서(마감 임박순) 그대로다. */
export function toQuickDeals(boards: readonly CatalogDemandBoardCardDto[]): ProductQuickDeal[] {
  return boards.map((dto) => ({
    id: String(dto.id),
    ...toDeadlineFields(dto.saleEndAt),
    participantCount: dto.participantCount,
    desiredPriceLabel: formatBoardPriceLabel(dto.priceMin, dto.priceMax),
    sellerCount: dto.sellerCount,
  }));
}

/**
 * B-06 검색 결과 카드의 수요 요약으로 옮긴다(TC-B06-01-02, #173). 모이는 보드가 없으면 null이고,
 * 카드는 '수요 없음'으로 그린다.
 *
 * - 건수·인원: 보드 수와 보드별 확정 인원의 합
 * - 마감: 가장 가까운 마감. 백엔드가 마감 임박순으로 주므로 마감이 있는 첫 보드다
 * - 상태: 가장 가까운 마감이 `IMMINENT_THRESHOLD_HOURS` 안이면 마감임박, 아니면 모집중
 *
 * 희망가 범위는 넣지 않는다. 9/25 PM 공지로 B-06 화면에서 제외됐다.
 */
export function toSearchDemandSummary(
  boards: readonly CatalogDemandBoardCardDto[],
): SearchDemandSummary | null {
  if (boards.length === 0) {
    return null;
  }
  const nearestEnd = boards.find((board) => board.saleEndAt !== null)?.saleEndAt ?? null;
  const nearestEndMs = nearestEnd === null ? Number.NaN : new Date(nearestEnd).getTime();
  const isClosing =
    !Number.isNaN(nearestEndMs) &&
    nearestEndMs - Date.now() < IMMINENT_THRESHOLD_HOURS * 60 * 60 * 1000;

  return {
    dday: computeDday(nearestEnd),
    demandStatus: isClosing ? 'closing' : 'gathering',
    quickDealCount: boards.length,
    participantCount: boards.reduce((sum, board) => sum + board.participantCount, 0),
  };
}

/**
 * 한 번에 이어 받을 최대 페이지 수. 백엔드 페이지 크기 상한이 20(`max-page-size`)이라 크기를 키워
 * 한 번에 받을 수 없다. 백엔드 쿼리 주석이 '도감 하나당 수요보드는 100개를 넘지 않는다'고 보므로
 * 20 × 5 = 100건에서 멈춘다.
 */
const MAX_PAGES = 5;

/**
 * 상품 도감 하나에 모이는 중인 수요보드 전부.
 *
 * 백엔드가 모이는 중(`GB_GATHERING`)이면서 마감 전인 보드만, 마감 임박순으로 준다. 한 페이지가
 * 20건이라 `hasNext`면 다음 페이지를 이어 받는다(`MAX_PAGES`까지). 건수·인원 합계가 일부 보드만
 * 반영하지 않게 한다.
 *
 * 응답을 가공하지 않고 돌려준다. 상품 상세 카드와 검색 결과 카드가 같은 응답을 서로 다른 모양으로
 * 쓰므로, 캐시는 응답 하나로 두고 모양은 훅의 `select`(`toQuickDeals`·`toSearchDemandSummary`)가 만든다.
 *
 * `GET /api/demand-boards/catalog/{catalogId}`
 */
export async function fetchCatalogDemandBoards(
  catalogId: number,
): Promise<CatalogDemandBoardCardDto[]> {
  const boards: CatalogDemandBoardCardDto[] = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const response = await apiFetch(
      `/api/demand-boards/catalog/${encodeURIComponent(String(catalogId))}?page=${page}`,
    );
    const data = (await response.json()) as CatalogDemandBoardListDto;
    boards.push(...data.demandBoards);
    if (!data.hasNext) {
      break;
    }
  }
  return boards;
}
