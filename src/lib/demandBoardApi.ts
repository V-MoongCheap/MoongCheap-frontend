import { IMMINENT_THRESHOLD_HOURS, PRICE_BANDS } from '@/constants/businessRules';
import type {
  CatalogDemandBoardCardDto,
  CatalogDemandBoardListDto,
  DemandBoardDetailDto,
  DemandBoardJoinRequestDto,
} from '@/types/api/demandBoard';
import type { DemandBoardDetail } from '@/types/demandBoard';
import type { DemandFormValues } from '@/types/demandForm';
import type { ProductQuickDeal } from '@/types/product';
import type { SearchDemandSummary } from '@/types/search';

import { apiFetch, parseCreatedId } from './api';
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

/* ── 수요 상세(B-12)·퀵 참여(FN-B12-02) ─────────────────────────────────────── */

/**
 * 화면이 분기하는 퀵 참여·수요 상세 에러 코드(백엔드 `ErrorCode`). `ApiError.code`로 온다.
 * - `DEMAND_004`: 없는 수요보드(404)
 * - `DEMAND_006`: 마감된 수요보드(400). 참여 제출 시점에 마감이 지났다
 * - `DEMAND_001`: 이미 진행 중인 수요가 있음(409). 같은 상품의 다른 보드에 참여·접수 중인 경우 포함
 * - `PAY_001`   : 유효한 결제수단이 없음(404). 보여 준 결제수단이 그사이 삭제·비활성됐다
 */
export const DEMAND_BOARD_ERROR_CODE = {
  NOT_FOUND: 'DEMAND_004',
  CLOSED: 'DEMAND_006',
  ALREADY_EXISTS: 'DEMAND_001',
  PAY_METHOD_NOT_FOUND: 'PAY_001',
} as const;

/**
 * 라우트의 수요보드 id를 백엔드 id(Long)로 바꾼다. 숫자가 아니거나 안전 정수를 넘으면 null.
 * `toCatalogId`(lib/productApi)와 같은 규칙이다.
 */
export function toDemandBoardId(id: string): number | null {
  if (!/^\d+$/.test(id)) {
    return null;
  }
  const demandBoardId = Number(id);
  return Number.isSafeInteger(demandBoardId) ? demandBoardId : null;
}

/**
 * 마감 이만큼 전부터 참여를 막는다. 명세 MC-B12-02 '마감 시각 도달 시(마감 1분 전) 참여 버튼을 즉시
 * 비활성화한다(마감 직전 경합 처리)'.
 */
const JOIN_CUTOFF_MS = 60 * 1000;

/**
 * 참여를 받을 수 없는 보드인지. 마감 시각이 없거나 `now` 기준 1분 안쪽이면 마감으로 본다.
 * `now`는 조회 시각을 넘긴다. 명세가 '인원·남은 시간은 조회 시점 스냅숏, 마감 도달은 재조회 시점에
 * 화면 반영'이라 화면을 띄운 채 시간이 흘러도 다시 조회하기 전에는 바꾸지 않는다.
 */
export function isDemandBoardClosed(saleEndAt: string | undefined, now: number): boolean {
  if (saleEndAt === undefined) {
    return true;
  }
  const end = new Date(saleEndAt).getTime();
  return Number.isNaN(end) || end - now <= JOIN_CUTOFF_MS;
}

/** 요일 한 글자. `Date.getDay()` 순서(일요일 0)다. */
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

/**
 * 마감 일시 표기. `2026-09-30T12:49:05` → `9월 30일 (수) 오후 12:49`. 모양이 다르면 받은 값을
 * 그대로 쓴다. `09.30 12:49`처럼 숫자만 두면 월·일과 오전·오후가 한눈에 읽히지 않아 풀어 쓴다.
 *
 * 백엔드 값은 시간대 없는 `LocalDateTime`이라 `Date`로 파싱하지 않고 글자에서 바로 꺼낸다(요일만
 * 날짜로 계산한다). 파싱하면 브라우저 시간대에 따라 날짜가 밀릴 수 있다.
 */
export function formatDemandBoardDeadline(saleEndAt: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(saleEndAt);
  if (match === null) {
    return saleEndAt;
  }
  const [, year, month, day, hourText, minute] = match;
  const hour = Number(hourText);
  const weekday = WEEKDAYS[new Date(Number(year), Number(month) - 1, Number(day)).getDay()];
  const period = hour < 12 ? '오전' : '오후';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${Number(month)}월 ${Number(day)}일 (${weekday}) ${period} ${hour12}:${minute}`;
}

/**
 * 남은 시간. 1시간 이상이면 D-day(`computeDday`와 같은 달력일 기준), 1시간 미만이면 분 단위
 * (명세 MC-B12-01 '1시간 미만이면 분 단위 표기'). 올림해서 '0분'은 만들지 않는다.
 */
export function remainingUntil(
  saleEndAt: string,
  now: number,
): { kind: 'dday'; days: number } | { kind: 'minutes'; minutes: number } {
  const diff = new Date(saleEndAt).getTime() - now;
  if (diff < 60 * 60 * 1000) {
    return { kind: 'minutes', minutes: Math.max(1, Math.ceil(diff / (60 * 1000))) };
  }
  return { kind: 'dday', days: computeDday(saleEndAt) };
}

function toDemandBoardDetail(dto: DemandBoardDetailDto): DemandBoardDetail {
  return {
    id: String(dto.demandBoardId),
    catalogId: String(dto.catalogId),
    catalogName: dto.catalogName,
    thumbnailUrl: dto.thumbnailUrl ?? undefined,
    participantCount: dto.participantCount ?? 0,
    sellerCount: dto.sellerCount ?? 0,
    desiredPriceLabel: formatBoardPriceLabel(dto.desiredPriceMin, dto.desiredPriceMax),
    saleEndAt: dto.saleEndAt ?? undefined,
    isParticipating: dto.isParticipating,
  };
}

/**
 * 수요보드 단건(MC-B12-01). 404(`DEMAND_004`)면 `ApiError`로 올라온다.
 *
 * `GET /api/demand-boards/{demandBoardId}`
 */
export async function fetchDemandBoard(demandBoardId: number): Promise<DemandBoardDetail> {
  const response = await apiFetch(
    `/api/demand-boards/${encodeURIComponent(String(demandBoardId))}`,
  );
  return toDemandBoardDetail((await response.json()) as DemandBoardDetailDto);
}

/** 퀵 참여 폼 값. 수요 등록 폼(`DemandFormValues`) 중 퀵 참여가 받는 것만 쓴다(MC-B12-02 입력 항목). */
export type QuickJoinValues = Pick<
  DemandFormValues,
  'quantity' | 'substituteAgreed' | 'substituteNote' | 'consents'
>;

/**
 * 퀵 참여 폼 값을 참여 바디로 옮긴다. 수요 등록의 `toDemandCreateRequest`와 같은 규칙이다.
 * 대체 상품 가능 범위는 동의했고 값이 있을 때만 보내고, 동의 4종은 1:1로 옮긴다.
 */
export function toDemandBoardJoinRequest(
  values: QuickJoinValues,
  payMethodId: number,
): DemandBoardJoinRequestDto {
  const isSubstitutable = values.substituteAgreed ?? false;
  const note = values.substituteNote.trim();

  return {
    payMethodId,
    quantity: values.quantity,
    isSubstitutable,
    extraRequirement: isSubstitutable && note !== '' ? note : undefined,
    autoPaymentAgreed: values.consents.autoPayment,
    privacyCollectionAgreed: values.consents.privacyCollection,
    privacyThirdPartyAgreed: values.consents.privacyThirdParty,
    paymentAgencyTermsAgreed: values.consents.pgTerms,
  };
}

/**
 * 퀵 참여 제출(FN-B12-02). 성공하면 생성된 수요 id를 돌려준다. 수요는 미배정 없이 바로 이 보드에
 * 편입된다(배정완료). 실패 코드는 `DEMAND_BOARD_ERROR_CODE`.
 *
 * `POST /api/demand-boards/{demandBoardId}/join` → `{ id }`
 */
export async function joinDemandBoard(
  demandBoardId: number,
  request: DemandBoardJoinRequestDto,
): Promise<string> {
  const response = await apiFetch(
    `/api/demand-boards/${encodeURIComponent(String(demandBoardId))}/join`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    },
  );
  return parseCreatedId(response);
}
