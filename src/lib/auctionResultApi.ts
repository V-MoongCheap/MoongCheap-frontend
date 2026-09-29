import { apiFetch } from '@/lib/api';
import { fetchDemandBoard, formatDemandBoardDeadline } from '@/lib/demandBoardApi';
import type { AuctionResultDto } from '@/types/api/auctionResult';
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
 * 응답을 화면 타입으로 옮긴다. null 필드는 키를 넣지 않아 화면이 그 줄을 숨긴다.
 *
 * 희망가는 보드 조회(`fetchDemandBoard`)의 라벨을 따로 받는다. 빈 문자열이면 줄을 숨긴다.
 * 자동결제 시각은 수요 상세(B-12)의 마감 일시와 같은 표기(`9월 28일 (월) 오후 9:05`)로 쓴다.
 */
export function toAwardResult(dto: AuctionResultDto, desiredPriceLabel: string): AwardResult {
  const expected = computeExpectedPayment(dto);

  return {
    isPaid: dto.demandStatus === 'CLOSED',
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
    ...(dto.shippingFee !== null && { shippingFee: dto.shippingFee }),
    ...(expected !== undefined && { expectedPaymentPrice: expected }),
    ...(dto.paymentDeadlineAt !== null && {
      paymentDeadlineLabel: formatDemandBoardDeadline(dto.paymentDeadlineAt),
    }),
  };
}

/**
 * 낙찰 결과 조회(FN-B19-01). `GET /api/demand-boards/{demandBoardId}/auction-result`.
 *
 * `GB_ACTION_REQUIRED` 상태의 보드에서 **본인** 낙찰 결과를 돌려준다. 다른 상태이거나 내 수요가
 * 없는 보드면 백엔드가 404(`DEMAND_004`)로 거절하고 `apiFetch`가 throw한다.
 *
 * 낙찰 결과 응답에 희망가가 없어 보드 단건(`GET /api/demand-boards/{id}`)을 병렬로 불러 보충한다.
 * 보조 정보라 그 조회가 실패해도 화면 전체를 실패시키지 않고 희망가 줄만 숨긴다.
 */
export async function fetchAwardResult(demandBoardId: number): Promise<AwardResult> {
  const [response, desiredPriceLabel] = await Promise.all([
    apiFetch(`/api/demand-boards/${encodeURIComponent(String(demandBoardId))}/auction-result`),
    fetchDemandBoard(demandBoardId)
      .then((board) => board.desiredPriceLabel)
      .catch(() => ''),
  ]);
  return toAwardResult((await response.json()) as AuctionResultDto, desiredPriceLabel);
}
