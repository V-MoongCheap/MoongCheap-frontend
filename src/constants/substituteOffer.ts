/**
 * 대체상품 수락/거절(B-16, FN-B16-01) 화면 문구·다이얼로그·토스트. **잠정**(디자인팀 휴가로 최종
 * 카피·시안 미확정 — 연휴 후 디자인 리뷰. 확정되면 이 파일만 손본다).
 *
 * AI가 비슷한 공구를 제안하면(대체상품 제안, 수요 상태 `SUBSTITUTE_OFFERED`) 사용자가 수락/거절하는
 * 화면이다. B-17 확인필요 탭 카드 → 이 화면으로 진입한다.
 *
 * ⚠️ 거절 동작의 결과 상태: 백엔드(`develop`, `DemandService.rejectOffer`)는 거절 시 거절 이력을
 *    저장한 뒤 수요를 **UNASSIGNED(모이는 중)로 되돌린다** — 이슈 #136 설명의 "요청 종료(EXPIRED)"와
 *    다르다. 그래서 거절 완료 문구는 상태를 단정하지 않고 '제안을 거절했다'는 사실만 알린다. v3.0
 *    규격과 배포 BE가 합의되면 이 문구를 조정한다.
 */

/** 화면 상단 안내. */
export const SUBSTITUTE_OFFER_COPY = {
  title: '대체상품 제안',
  /** 화면 헤더 설명. */
  heading: '비슷한 공동구매를 찾았어요',
  description:
    '원하시던 상품 대신 아래 공동구매에 참여할 수 있어요. 제안을 확인하고 결정해 주세요.',
  /** 두 상품 카드 구역 라벨. */
  requestedLabel: '내가 등록한 수요',
  substituteLabel: 'AI가 제안한 대체상품',
  /** 대체상품 카드의 참고가 라벨(정가 노출 시). */
  listPriceLabel: '정가',
  /** 내 참여 조건 요약 라벨. */
  quantityLabel: '수량',
  desiredPriceLabel: '희망 가격대',
  /** 하단 CTA. */
  acceptCta: '수락하기',
  rejectCta: '거절하기',
} as const;

/** 거절 확인 다이얼로그(파괴적 확인). */
export const REJECT_SUBSTITUTE_DIALOG = {
  title: '이 제안을 거절할까요?',
  message: '거절하면 이 대체상품 제안이 사라져요.',
  confirmLabel: '거절하기',
  cancelLabel: '돌아가기',
} as const;

/** 수락/거절 결과 토스트. */
export const SUBSTITUTE_OFFER_TOAST = {
  acceptSuccess: '대체상품을 수락했어요',
  rejectSuccess: '대체상품 제안을 거절했어요',
  /** 이미 처리됐거나 기간이 지나 더 응답할 수 없을 때(404/400). */
  gone: '이미 처리되었거나 기간이 지난 제안이에요',
  /** 그 밖의 실패(네트워크·서버). */
  failed: '잠시 후 다시 시도해 주세요',
} as const;
