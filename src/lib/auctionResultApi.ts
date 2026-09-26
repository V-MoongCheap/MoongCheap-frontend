import { apiFetch } from '@/lib/api';
import { formatBoardPriceLabel } from '@/lib/demandBoardApi';
import type { AuctionResultDto, DemandBoardPriceDto } from '@/types/api/auctionResult';
import type { AwardResult } from '@/types/awardResult';

/**
 * 낙찰 결과(B-19) 조회와 화면 타입 변환.
 *
 * 세션(SID httpOnly 쿠키)이 필요해 **브라우저에서만** 부른다. 서버 컴포넌트에서 부르면 쿠키 없이
 * 나가 401이다(`lib/demandApi.ts`·`lib/orderApi.ts`와 같은 이유).
 *
 * 응답에 없는 값은 화면이 줄을 숨긴다. mock으로 채우지 않는다(#187).
 * ⚠️ 명세에 있지만 응답에 없는 값: **낙찰 날짜**(`judged_at`은 `+48시간` 계산에만 쓰고 안 내려옴)·
 *    **응찰 건수**·**브랜드**(이슈 #137·#187로 백엔드에 요청).
 */

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

/**
 * 결제 예정 금액. 명세 FN-B19-01의 `낙찰 단가 × 내 수량 + 배송비`다.
 * 단가·수량 중 하나라도 없으면 계산하지 않고 undefined를 돌려준다.
 */
function computeExpectedPayment(dto: AuctionResultDto): number | undefined {
  const { unitPrice, quantity, shippingFee } = dto;
  if (unitPrice === null || quantity === null) {
    return undefined;
  }
  return unitPrice * quantity + (shippingFee ?? 0);
}

/**
 * 자동결제 예정 시각 표기. `2026-09-28T21:05:00` → `9월 28일 (월) 오후 9:05`.
 *
 * 백엔드 값이 시간대 없는 `LocalDateTime`이라 `Date`로 파싱하지 않고 글자에서 꺼낸다(브라우저
 * 시간대에 따라 시각이 밀리지 않게). 요일은 날짜만으로 구하므로 UTC로 계산해도 같다.
 * 모양이 다르면 undefined(호출부가 기본 안내 문구를 쓴다).
 */
export function formatPaymentDeadline(localDateTime: string | null): string | undefined {
  if (localDateTime === null) {
    return undefined;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(localDateTime);
  if (match === null) {
    return undefined;
  }
  const [, year, month, day, hour, minute] = match;
  const weekday = WEEKDAYS[new Date(Date.UTC(+year, +month - 1, +day)).getUTCDay()];
  const hour24 = Number(hour);
  const meridiem = hour24 < 12 ? '오전' : '오후';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${Number(month)}월 ${Number(day)}일 (${weekday}) ${meridiem} ${hour12}:${minute}`;
}

/**
 * 응답을 화면 타입으로 옮긴다. null 필드는 키를 넣지 않아 화면이 그 줄을 숨긴다.
 * 희망가는 보드 조회 결과를 따로 받는다(없으면 undefined).
 */
export function toAwardResult(
  dto: AuctionResultDto,
  board: DemandBoardPriceDto | null,
): AwardResult {
  const expected = computeExpectedPayment(dto);
  const desiredPriceLabel =
    board === null ? '' : formatBoardPriceLabel(board.desiredPriceMin, board.desiredPriceMax);
  const paymentDeadlineLabel = formatPaymentDeadline(dto.paymentDeadlineAt);

  return {
    productName: dto.catalogName,
    ...(dto.thumbnail_url !== null && { thumbnailUrl: dto.thumbnail_url }),
    ...(dto.unitPrice !== null && { finalBidPrice: dto.unitPrice }),
    ...(desiredPriceLabel !== '' && { desiredPriceLabel }),
    ...(dto.quantity !== null && { myQuantity: dto.quantity }),
    ...(dto.sellerName !== null && { sellerName: dto.sellerName }),
    ...(dto.participantCount !== null && { participantCount: dto.participantCount }),
    ...(dto.totalParticipantQuantity !== null && {
      totalParticipantQuantity: dto.totalParticipantQuantity,
    }),
    ...(expected !== undefined && { expectedPaymentPrice: expected }),
    ...(paymentDeadlineLabel !== undefined && { paymentDeadlineLabel }),
  };
}

/**
 * 보드 희망 가격대. 낙찰 결과 응답에 희망가가 없어 보드 단건 조회로 보충한다.
 * 보조 정보라 실패해도 화면 전체를 실패시키지 않고 null을 돌려준다(희망가 줄만 숨김).
 *
 * `GET /api/demand-boards/{demandBoardId}`
 */
async function fetchBoardPrice(demandBoardId: string): Promise<DemandBoardPriceDto | null> {
  try {
    const response = await apiFetch(`/api/demand-boards/${encodeURIComponent(demandBoardId)}`);
    return (await response.json()) as DemandBoardPriceDto;
  } catch {
    return null;
  }
}

/**
 * 낙찰 결과 조회(FN-B19-01). `GET /api/demand-boards/{demandBoardId}/auction-result`.
 *
 * `GB_ACTION_REQUIRED` 상태의 보드에서 **본인** 낙찰 결과를 돌려준다. 다른 상태이거나 내 수요가
 * 없는 보드면 백엔드가 404(`DEMAND_004`)로 거절하고 `apiFetch`가 throw한다. 희망가 보충 조회는
 * 병렬로 보낸다.
 */
export async function fetchAwardResult(demandBoardId: string): Promise<AwardResult> {
  const [response, board] = await Promise.all([
    apiFetch(`/api/demand-boards/${encodeURIComponent(demandBoardId)}/auction-result`),
    fetchBoardPrice(demandBoardId),
  ]);
  return toAwardResult((await response.json()) as AuctionResultDto, board);
}
