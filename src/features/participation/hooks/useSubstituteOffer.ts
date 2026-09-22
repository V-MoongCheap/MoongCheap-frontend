'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  acceptSubstituteOffer,
  fetchSubstituteOffer,
  rejectSubstituteOffer,
} from '@/lib/demandApi';
import { shouldRetryQuery } from '@/lib/queryRetry';

// 대체상품 제안 조회·수락·거절(B-16, FN-B16-01). 조회가 클라이언트인 이유는 `useMyDemands`·
// `lib/demandApi.ts` 주석 참고(SID httpOnly 쿠키는 브라우저만 갖고 있다).

export const SUBSTITUTE_OFFER_QUERY_KEYS = {
  detail: (demandId: string) => ['demands', 'substitute', demandId] as const,
};

/** 참여 목록(B-17) 캐시 접두어. 수락/거절 성공 시 탭 전체를 무효화해 서버 기준으로 다시 받는다. */
const PARTICIPATION_LIST_PREFIX = ['demands', 'list'] as const;

/** 대체상품 제안 단건 조회. */
export function useSubstituteOffer(demandId: string) {
  return useQuery({
    queryKey: SUBSTITUTE_OFFER_QUERY_KEYS.detail(demandId),
    queryFn: () => fetchSubstituteOffer(demandId),
    retry: shouldRetryQuery,
  });
}

/**
 * 수락/거절 성공 후 캐시 무효화. 참여 목록(B-17) 전 탭과 이 제안 상세를 무효화한다. 낙관적 갱신을
 * 쓰지 않는 이유는 배송지 뮤테이션과 같다 — 상태 전이(편입 ASSIGNED / 거절 후 복귀)가 서버 트랜잭션
 * 이라, 재조회 한 번이면 어느 탭에 놓일지까지 서버 기준으로 정확히 맞는다.
 */
function useInvalidateAfterOfferAction(demandId: string) {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: PARTICIPATION_LIST_PREFIX }),
      queryClient.invalidateQueries({
        queryKey: SUBSTITUTE_OFFER_QUERY_KEYS.detail(demandId),
      }),
    ]);
  };
}

/** 대체 오퍼 수락 뮤테이션. `PATCH .../accept`. */
export function useAcceptSubstituteOffer(demandId: string) {
  const invalidate = useInvalidateAfterOfferAction(demandId);
  return useMutation({
    mutationFn: () => acceptSubstituteOffer(demandId),
    onSuccess: invalidate,
  });
}

/** 대체 오퍼 거절 뮤테이션. `PATCH .../reject`. */
export function useRejectSubstituteOffer(demandId: string) {
  const invalidate = useInvalidateAfterOfferAction(demandId);
  return useMutation({
    mutationFn: () => rejectSubstituteOffer(demandId),
    onSuccess: invalidate,
  });
}
