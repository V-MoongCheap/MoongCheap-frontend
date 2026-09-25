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
 * 이 시간 안에 마감하는 보드는 D-day 대신 실시간 카운트다운(`HH:MM:SS`)으로 그린다.
 *
 * 시안 카드가 `D-1`과 `00:08:55` 두 형태를 다 쓰는데 가르는 기준은 시안·명세에 없다. 카운트다운의
 * 시(時) 자리가 두 자리를 넘지 않는 24시간으로 잡았다.
 */
const COUNTDOWN_WINDOW_MS = 24 * 60 * 60 * 1000;

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
 * 보드 희망 가격대 범위 표기. 집계값을 만원 단위로 내린다(`PRICE_BANDS` 주석의 B-06 규칙).
 * 예: 20,001~100,000 → `2만~10만원`. 내린 두 값이 같으면 하나만 쓴다.
 */
export function formatBoardPriceRange(min: number, max: number): string {
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

/** 마감 표기 값. 24시간 안이면 카운트다운, 그보다 멀면 D-day. 마감이 없거나 깨졌으면 둘 다 없다. */
function toDeadlineFields(saleEndAt: string | null): Pick<ProductQuickDeal, 'dday' | 'deadline'> {
  if (saleEndAt === null) {
    return {};
  }
  const end = new Date(saleEndAt).getTime();
  if (Number.isNaN(end)) {
    return {};
  }
  return end - Date.now() < COUNTDOWN_WINDOW_MS
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
 * - 희망가: 보드들의 최소 하한 ~ 최대 상한을 만원 단위로 내린다(`PRICE_BANDS` 주석의 B-06 규칙)
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

  const mins = boards.flatMap((board) => (board.priceMin === null ? [] : [board.priceMin]));
  const maxes = boards.flatMap((board) => (board.priceMax === null ? [] : [board.priceMax]));

  return {
    dday: computeDday(nearestEnd),
    demandStatus: isClosing ? 'closing' : 'gathering',
    quickDealCount: boards.length,
    participantCount: boards.reduce((sum, board) => sum + board.participantCount, 0),
    desiredPriceLabel:
      mins.length === 0 || maxes.length === 0
        ? undefined
        : formatBoardPriceRange(Math.min(...mins), Math.max(...maxes)),
  };
}

/**
 * 상품 도감 하나에 모이는 중인 수요보드.
 *
 * 백엔드가 모이는 중(`GB_GATHERING`)이면서 마감 전인 보드만, 마감 임박순으로 준다. 첫 페이지(20건)만
 * 받는다. 도감 하나에 동시에 모이는 보드가 20개를 넘는 경우는 시드·시연 범위에 없다.
 *
 * 응답을 가공하지 않고 돌려준다. 상품 상세 카드와 검색 결과 카드가 같은 응답을 서로 다른 모양으로
 * 쓰므로, 캐시는 응답 하나로 두고 모양은 훅의 `select`(`toQuickDeals`·`toSearchDemandSummary`)가 만든다.
 *
 * `GET /api/demand-boards/catalog/{catalogId}`
 */
export async function fetchCatalogDemandBoards(
  catalogId: number,
): Promise<CatalogDemandBoardCardDto[]> {
  const response = await apiFetch(
    `/api/demand-boards/catalog/${encodeURIComponent(String(catalogId))}`,
  );
  const data = (await response.json()) as CatalogDemandBoardListDto;
  return data.demandBoards;
}
