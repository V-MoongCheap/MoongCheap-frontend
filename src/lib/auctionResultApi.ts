import { apiFetch } from '@/lib/api';
import type { AuctionResultDto } from '@/types/api/auctionResult';
import type { AwardResult } from '@/types/awardResult';

/**
 * 낙찰 결과(B-19) 조회와 화면 타입 변환.
 *
 * 세션(SID httpOnly 쿠키)이 필요해 **브라우저에서만** 부른다. 서버 컴포넌트에서 부르면 쿠키 없이
 * 나가 401이다(`lib/demandApi.ts`·`lib/orderApi.ts`와 같은 이유).
 *
 * ⚠️ 응답에 없어 아직 못 채우는 값이 둘 있다(이슈 #137).
 *    - **낙찰 날짜**: 백엔드가 `judged_at`을 받아 `+48시간`(`paymentDeadlineAt`) 계산에만 쓰고 버린다.
 *    - **최종 응찰 수**: `product_award_evaluation`을 보드 기준으로 센 값이 응답에 없다.
 *    두 값은 호출부가 mock을 유지한다. 응답에 추가되면 이 파일의 변환만 고치면 된다.
 */

/** 화면 타입으로 옮긴 결과와, 응답에 없어 호출부가 mock을 유지해야 하는 값의 목록. */
export interface AuctionResultPatch {
  /** 응답으로 채운 값만 담는다. 나머지 키는 없다(호출부가 기존 값을 유지). */
  readonly patch: Partial<AwardResult>;
  /** 자동결제 예정 시각(ISO). 상단 안내 문구에 쓴다. 응답에 없으면 undefined. */
  readonly paymentDeadlineAt?: string;
}

/**
 * 결제 예정 금액. 명세 FN-B19-01의 `낙찰 단가 × 내 수량 + 배송비`다.
 *
 * 화면 mock은 이 값을 최종 낙찰가와 같게 두고 있었는데(수량·배송비 누락), 백엔드가 세 값을 모두
 * 주므로 여기서 명세대로 계산한다. 하나라도 없으면 계산하지 않고 undefined를 돌려준다.
 */
function computeExpectedPayment(dto: AuctionResultDto): number | undefined {
  const { unitPrice, quantity, shippingFee } = dto;
  if (unitPrice === null || quantity === null) {
    return undefined;
  }
  return unitPrice * quantity + (shippingFee ?? 0);
}

/**
 * 응답을 화면 타입 조각으로 옮긴다.
 *
 * 값이 null인 필드는 **키 자체를 넣지 않는다.** 호출부가 `{ ...prev, ...patch }`로 덮기 때문에,
 * 키를 undefined로라도 넣으면 mock 값이 지워져 화면이 비게 된다.
 */
function toAwardResultPatch(dto: AuctionResultDto): AuctionResultPatch {
  const expected = computeExpectedPayment(dto);

  return {
    patch: {
      productName: dto.catalogName,
      ...(dto.unitPrice !== null && { finalBidPrice: dto.unitPrice }),
      ...(dto.quantity !== null && { myQuantity: dto.quantity }),
      ...(dto.sellerName !== null && { sellerName: dto.sellerName }),
      ...(dto.participantCount !== null && { participantGroupCount: dto.participantCount }),
      ...(expected !== undefined && { expectedPaymentPrice: expected }),
    },
    paymentDeadlineAt: dto.paymentDeadlineAt ?? undefined,
  };
}

/**
 * 낙찰 결과 조회(FN-B19-01). `GET /api/demand-boards/{demandBoardId}/auction-result`.
 *
 * `GB_ACTION_REQUIRED` 상태의 보드에서 **본인** 낙찰 결과를 돌려준다. 다른 상태이거나 내 수요가
 * 없는 보드면 백엔드가 4xx로 거절하고 `apiFetch`가 throw한다.
 */
export async function fetchAuctionResult(demandBoardId: string): Promise<AuctionResultPatch> {
  const response = await apiFetch(
    `/api/demand-boards/${encodeURIComponent(demandBoardId)}/auction-result`,
  );
  return toAwardResultPatch((await response.json()) as AuctionResultDto);
}
