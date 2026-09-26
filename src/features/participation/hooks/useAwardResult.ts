'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchAwardResult } from '@/lib/auctionResultApi';
import { shouldRetryQuery } from '@/lib/queryRetry';

// 낙찰 결과 조회(B-19, FN-B19-01). 조회가 클라이언트인 이유는 `useSubstituteOffer`와 같다
// (SID httpOnly 쿠키는 브라우저만 갖고 있다).

export const AWARD_RESULT_QUERY_KEYS = {
  detail: (demandBoardId: string) => ['demand-boards', 'auction-result', demandBoardId] as const,
};

/** 낙찰 결과 단건 조회. 보드 id가 숫자가 아니면 부르지 않는다(호출부가 없는 결과로 처리). */
export function useAwardResult(demandBoardId: string) {
  return useQuery({
    queryKey: AWARD_RESULT_QUERY_KEYS.detail(demandBoardId),
    queryFn: () => fetchAwardResult(demandBoardId),
    enabled: /^\d+$/.test(demandBoardId),
    retry: shouldRetryQuery,
  });
}
