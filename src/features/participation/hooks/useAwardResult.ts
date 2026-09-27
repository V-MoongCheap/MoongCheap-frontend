'use client';

import { skipToken, useQuery } from '@tanstack/react-query';

import { DEMAND_BOARD_QUERY_KEYS } from '@/features/product/hooks/useCatalogDemandBoards';
import { fetchAwardResult } from '@/lib/auctionResultApi';
import { shouldRetryQuery } from '@/lib/queryRetry';

// 낙찰 결과 조회(B-19, FN-B19-01). 조회가 클라이언트인 이유는 `useSubstituteOffer`와 같다
// (SID httpOnly 쿠키는 브라우저만 갖고 있다).

/**
 * 낙찰 결과 캐시 키. 수요보드 캐시(`DEMAND_BOARD_QUERY_KEYS.all`) 아래에 두어, 보드 캐시를 한꺼번에
 * 무효화할 때(퀵 참여 등) 함께 지워지게 한다.
 */
export const AWARD_RESULT_QUERY_KEYS = {
  detail: (demandBoardId: number | null) =>
    [...DEMAND_BOARD_QUERY_KEYS.all, 'auction-result', demandBoardId] as const,
};

/**
 * 낙찰 결과 단건 조회. 보드 id는 `toDemandBoardId`로 바꾼 값이며, null(숫자가 아닌 주소)이면
 * 부르지 않는다(호출부가 없는 결과로 처리).
 */
export function useAwardResult(demandBoardId: number | null) {
  return useQuery({
    queryKey: AWARD_RESULT_QUERY_KEYS.detail(demandBoardId),
    queryFn: demandBoardId === null ? skipToken : () => fetchAwardResult(demandBoardId),
    retry: shouldRetryQuery,
  });
}
