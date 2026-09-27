'use client';

import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { DEMAND_QUERY_KEYS } from '@/features/participation/hooks/useMyDemands';
import { DEMAND_BOARD_QUERY_KEYS } from '@/features/product/hooks/useCatalogDemandBoards';
import {
  fetchDemandBoard,
  joinDemandBoard,
  type QuickJoinValues,
  toDemandBoardJoinRequest,
} from '@/lib/demandBoardApi';
import { shouldRetryQuery } from '@/lib/queryRetry';

/**
 * 수요보드 단건 조회(MC-B12-01). 세션(SID httpOnly 쿠키)이 필요해 client에서 부른다.
 *
 * `demandBoardId`가 null이면(숫자가 아닌 주소) 조회하지 않는다. 호출부가 404로 그린다.
 */
export function useDemandBoard(demandBoardId: number | null) {
  return useQuery({
    queryKey: DEMAND_BOARD_QUERY_KEYS.detail(demandBoardId),
    queryFn: demandBoardId === null ? skipToken : () => fetchDemandBoard(demandBoardId),
    retry: shouldRetryQuery,
  });
}

interface JoinVariables {
  demandBoardId: number;
  payMethodId: number;
  values: QuickJoinValues;
}

/**
 * 퀵 참여 제출(FN-B12-02). `POST /api/demand-boards/{id}/join`.
 *
 * 성공하면 수요보드 캐시(상세 인원·참여 여부, 상품 상세 퀵 참여 카드)와 내 참여 목록(B-17) 캐시를
 * 무효화한다. 참여 직후 B-17로 이동하므로, 무효화하지 않으면 신선도 시간 동안 방금 참여한 수요가
 * 목록에 없다(`useCreateDemand`와 같은 이유).
 */
export function useJoinDemandBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ demandBoardId, payMethodId, values }: JoinVariables) =>
      joinDemandBoard(demandBoardId, toDemandBoardJoinRequest(values, payMethodId)),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: DEMAND_BOARD_QUERY_KEYS.all }),
        queryClient.invalidateQueries({ queryKey: DEMAND_QUERY_KEYS.all }),
      ]);
    },
  });
}
