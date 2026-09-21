import { LIST_PAGE_SIZE, PRICE_BANDS } from '@/constants/businessRules';
import type { ParticipationStatus } from '@/constants/participationStatus';
import type { DemandItemDto, DemandListDto, DemandStatusDto } from '@/types/api/demand';
import type { DemandFormValues } from '@/types/demandForm';
import type { ParticipationItem, ParticipationPage } from '@/types/participation';

import { apiFetch, parseCreatedId } from './api';
import { formatWon } from './formatPrice';

/**
 * 수요 등록(B-09) 백엔드 호출.
 *
 * `lib/addressApi.ts`와 같은 규칙이다. 화면은 백엔드 DTO를 모르고 폼 값(`DemandFormValues`)만
 * 안다. 변환은 전부 이 파일이 맡는다. 인증은 SID httpOnly 쿠키라 `apiFetch`가 `credentials`를
 * 붙이고, 세션이 필요하므로 **브라우저에서만** 부른다.
 *
 * 백엔드 소스(V-MoongCheap/MoongCheap-backend@develop `DemandController`·`DemandCreateRequestDto`·
 * `DemandService.create`)로 규격을 확인해 작성했다(2026-09-17).
 *
 * 🔴 **제출 배선 보류 사유(#112)**: `payMethodId`는 필수이고, `DemandService.create`가 회원의
 *    ACTIVE 브랜드페이 결제수단 존재를 검증한다(`existsByIdAndMemberIdAndStatus`). 그런데 백엔드에
 *    결제수단을 등록·조회하는 엔드포인트가 아직 없어(토스 브랜드페이 미배선) 프론트가 유효한
 *    `payMethodId`를 얻을 방법이 없다. 그래서 이 모듈(요청/매핑/호출)은 완성해 두되, 실제 제출은
 *    결제수단 조회 API가 생긴 뒤 화면에서 연결한다. 그 전까지 `DemandFormView`는 준비중을 알린다.
 */

/**
 * `POST /api/members/me/demand` 요청 바디. 백엔드 `DemandCreateRequestDto`(record)와 필드가 일치한다.
 *
 * - 동의 4종은 백엔드에서 전부 `@AssertTrue`라 반드시 true여야 한다. DB에는 저장하지 않고 검증만 한다.
 * - `desireEndAt`(마감시각)은 서버가 `now + 2일`로 자동 세팅하므로 보내지 않는다.
 */
export interface DemandCreateRequestDto {
  catalogId: number;
  payMethodId: number;
  /** 희망 최소가(≥0). 화면 가격 구간의 `min`. */
  desiredPriceMin: number;
  /** 희망 최대가(≥0). 화면 가격 구간의 `max`. */
  desiredPriceMax: number;
  /** 수량(1~99). */
  quantity: number;
  /** 추가 요청사항(≤200). 없으면 생략한다. */
  extraRequirement?: string;
  /** 대체 상품 수용 여부. */
  isSubstitutable: boolean;
  autoPaymentAgreed: boolean;
  privacyCollectionAgreed: boolean;
  privacyThirdPartyAgreed: boolean;
  paymentAgencyTermsAgreed: boolean;
}

/**
 * 화면이 분기하는 수요 등록 고유 에러 코드(백엔드 `ErrorCode`). `ApiError.code`로 온다.
 * - `DEMAND_001`: 같은 카탈로그에 진행 중인 수요가 이미 있음(409).
 * - `PAY_001`   : 유효한 결제수단이 없음(404). payMethodId 미배선 상태에서 나오는 코드.
 */
export const DEMAND_ERROR_CODE = {
  ALREADY_EXISTS: 'DEMAND_001',
  PAY_METHOD_NOT_FOUND: 'PAY_001',
} as const;

/**
 * 폼 값을 등록 바디로 옮긴다. 카탈로그·결제수단 id는 폼 밖에서 정해지므로 인자로 받는다.
 *
 * - **가격**: 폼은 구간(`priceBand`) 하나를 고르고, 백엔드는 min·max를 받는다. `PRICE_BANDS`의
 *   경계값을 그대로 보낸다(최상위 `over_100k`의 max는 내부 상한 999,999로, 화면엔 노출하지 않지만
 *   저장값으로는 그대로 쓴다 — `businessRules.ts` 주석). 구간 미선택은 등록 불가라 방어적으로 던진다.
 * - **추가 요청사항**: 폼의 대체상품 가능 범위(`substituteNote`)를 옮긴다. 별도의 자유 요청 입력이
 *   폼에 없어 이 값이 유일한 자연어 필드다. 단, 이 노트는 대체상품에 **동의했을 때만** 의미가 있으므로
 *   `isSubstitutable`이 참이고 값이 있을 때만 보낸다. 동의 안 함으로 되돌리면(노트 상태는 남는다)
 *   과거 노트가 딸려 가지 않도록 한다.
 * - **동의 4종 1:1 매핑**: 백엔드가 개인정보 수집·이용(`privacyCollectionAgreed`)과 제3자 제공
 *   (`privacyThirdPartyAgreed`)을 나눠 받으므로, 폼도 두 동의를 따로 받아 각각 그대로 옮긴다. 하나의
 *   동의를 두 필드에 함께 넣어 받지 않은 동의를 참으로 꾸미지 않는다(동의 무결성).
 */
export function toDemandCreateRequest(
  values: DemandFormValues,
  ids: { catalogId: number; payMethodId: number },
): DemandCreateRequestDto {
  const band = PRICE_BANDS.find((b) => b.key === values.priceBand);
  if (band === undefined) {
    throw new Error('희망 가격대를 선택해야 수요를 등록할 수 있습니다.');
  }

  const isSubstitutable = values.substituteAgreed ?? false;
  const note = values.substituteNote.trim();

  return {
    catalogId: ids.catalogId,
    payMethodId: ids.payMethodId,
    desiredPriceMin: band.min,
    desiredPriceMax: band.max,
    quantity: values.quantity,
    extraRequirement: isSubstitutable && note !== '' ? note : undefined,
    isSubstitutable,
    autoPaymentAgreed: values.consents.autoPayment,
    privacyCollectionAgreed: values.consents.privacyCollection,
    privacyThirdPartyAgreed: values.consents.privacyThirdParty,
    paymentAgencyTermsAgreed: values.consents.pgTerms,
  };
}

/**
 * 수요 등록. 성공 시 생성된 수요 id를 돌려준다.
 *
 * 같은 카탈로그에 진행 중인 수요가 있으면 409(`DEMAND_001`), 결제수단이 유효하지 않으면
 * 404(`PAY_001`)가 `ApiError`로 올라온다. 화면이 `error.code`로 분기한다.
 *
 * `POST /api/members/me/demand` → 생성된 id
 */
export async function createDemand(payload: DemandCreateRequestDto): Promise<string> {
  const response = await apiFetch('/api/members/me/demand', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseCreatedId(response);
}

/* ── 참여 목록 조회(B-17, FN-B17-01) ─────────────────────────────────────────── */

/**
 * 백엔드 상태 → 화면 상태 레지스트리 키(`constants/participationStatus.ts`).
 *
 * 낙찰 후 자동결제 대기(`PAYMENT_PENDING`)는 배정완료(`ALLOCATED`)로 합류시킨다(2026-09-17 결정).
 * 터미널 4종(`FAILED`·`CANCELED`·`EXPIRED`·`DELETED`)은 탭이 없어 이 표에 넣지 않는다 —
 * 애초에 조회 대상 statuses에서 빠지지만, 혹시 섞여 와도 아래 변환에서 걸러 그 항목만 버린다.
 */
const STATUS_FROM_DTO: Partial<Record<DemandStatusDto, ParticipationStatus>> = {
  UNASSIGNED: 'GATHERING',
  SUBSTITUTE_OFFERED: 'ACTION_REQUIRED',
  ASSIGNED: 'ALLOCATED',
  PAYMENT_PENDING: 'ALLOCATED',
  CLOSED: 'DONE',
};

/** 응답 상태를 화면 키로 옮긴다. 표에 없으면 undefined(그 항목은 목록에서 제외). */
function toParticipationStatus(value: DemandStatusDto): ParticipationStatus | undefined {
  return Object.prototype.hasOwnProperty.call(STATUS_FROM_DTO, value)
    ? STATUS_FROM_DTO[value]
    : undefined;
}

/** `2026-08-10T13:24:00` → 시안 표기 `2026.08.10`. 모양이 다르면 받은 값을 그대로 쓴다. */
function formatRequestedAt(iso: string | null): string {
  if (iso === null) {
    return '';
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (match === null) {
    return iso;
  }
  const [, year, month, day] = match;
  return `${year}.${month}.${day}`;
}

/**
 * 마감(`desireEndAt`)까지 남은 일수. 오늘 자정 기준 달력일 차이로 세고, 지난 마감은 0으로 둔다.
 * 시각까지 빼면 같은 날 오전·오후에 D-0/D-1이 갈려 표기가 흔들려서, 날짜만 비교한다.
 */
function computeDday(iso: string | null): number {
  if (iso === null) {
    return 0;
  }
  const end = new Date(iso);
  if (Number.isNaN(end.getTime())) {
    return 0;
  }
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const diffDays = Math.round((startOfEnd.getTime() - startOfToday.getTime()) / 86_400_000);
  return Math.max(0, diffDays);
}

/** 가격 범위 표기. 단일값이면 한 개만, 범위면 `N원 ~ M원`. */
function formatPriceRange(min: number, max: number): string {
  return min === max ? formatWon(min) : `${formatWon(min)} ~ ${formatWon(max)}`;
}

/**
 * 카드 가격 문구 = **희망 가격대**. 저장값(`desiredPriceMin/Max`)이 등록 시 고른 `PRICE_BANDS`
 * 경계와 같으므로 해당 구간 라벨('3만원 이하')로 되돌린다. 구간과 맞지 않으면(구간 규칙이 바뀐
 * 과거 데이터 등) 범위 그대로 표기한다.
 *
 * ⚠️ 완료(`DONE`) 카드의 헤더는 '낙찰가'지만, **참여 목록 응답(`DemandItemDto`)에는 낙찰가가 없다.**
 *    `demandBoard.priceMin/priceMax`는 보드 형성 계획가(`FormationPlanRequestDto`)일 뿐 확정 낙찰가가
 *    아니라(확정가는 낙찰 결과 API B-19·FN-B19-01에만 있음, `AwardingController`), 그 값을 낙찰가로
 *    쓰면 잘못된 금액을 노출한다. 그래서 완료도 우선 희망 가격대를 표기한다. 실제 낙찰가는 목록 응답에
 *    낙찰가 필드가 추가되거나 낙찰 결과를 함께 조회하도록 배선한 뒤 교체한다(후속).
 */
function formatPriceLabel(dto: DemandItemDto): string {
  const { desiredPriceMin, desiredPriceMax } = dto;
  if (desiredPriceMin === null || desiredPriceMax === null) {
    return '';
  }
  const band = PRICE_BANDS.find((b) => b.min === desiredPriceMin && b.max === desiredPriceMax);
  return band?.label ?? formatPriceRange(desiredPriceMin, desiredPriceMax);
}

/**
 * 응답 한 건을 카드 모양으로 옮긴다. 상태가 화면 탭에 매핑되지 않으면 null(호출부가 걸러 낸다).
 *
 * ⚠️ 참여 인원(`demandBoard.participantCount`)은 보드가 배정된 뒤에만 있다. 방금 등록해 아직 보드가
 *    없는 '모이는 중' 수요는 `demandBoard`가 통째로 null이라 배지를 생략한다(카드가 처리).
 */
function toParticipationItem(dto: DemandItemDto): ParticipationItem | null {
  const status = toParticipationStatus(dto.status);
  if (status === undefined) {
    return null;
  }
  return {
    id: String(dto.id),
    productName: dto.catalog.name,
    specSummary: dto.catalog.specSummary ?? undefined,
    quantity: dto.quantity ?? undefined,
    priceLabel: formatPriceLabel(dto),
    participantCount: dto.demandBoard?.participantCount,
    dday: computeDday(dto.desireEndAt),
    requestedAt: formatRequestedAt(dto.createdAt),
    status,
  };
}

/**
 * 내 수요 참여 목록 한 페이지. 세션(SID httpOnly 쿠키)이 필요해 **브라우저에서만** 부른다
 * (서버 컴포넌트에서 부르면 쿠키 없이 나가 401 — `lib/orderApi.ts`와 같은 이유).
 *
 * `statuses`는 **복수 파라미터**(`?statuses=UNASSIGNED&statuses=ASSIGNED`)로 나간다. 백엔드는
 * `statuses` 미전달 시 진행중 4종만 주고 완료를 빼므로, 완료 포함 조회를 위해 호출부(`useMyDemands`)가
 * 탭별로 항상 명시적으로 넣는다.
 *
 * `GET /api/members/me/demand?statuses=&page=&size=`
 */
export async function fetchMyDemands(
  statuses: readonly DemandStatusDto[],
  page: number,
): Promise<ParticipationPage> {
  const params = new URLSearchParams();
  for (const status of statuses) {
    params.append('statuses', status);
  }
  params.set('page', String(page));
  params.set('size', String(LIST_PAGE_SIZE));

  const response = await apiFetch(`/api/members/me/demand?${params.toString()}`);
  const body = (await response.json()) as DemandListDto;

  return {
    items: body.demands.flatMap((dto) => {
      const item = toParticipationItem(dto);
      return item === null ? [] : [item];
    }),
    page: body.page,
    hasNext: body.hasNext,
  };
}
