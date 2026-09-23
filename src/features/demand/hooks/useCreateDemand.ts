'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { DEMAND_QUERY_KEYS } from '@/features/participation/hooks/useMyDemands';
import { createDemand, type DemandCreateRequestDto } from '@/lib/demandApi';

/**
 * 수요 등록 뮤테이션(FN-B09-04, #148). `POST /api/members/me/demand`.
 *
 * 성공하면 내 참여 목록(B-17) 캐시를 탭 구분 없이 무효화한다. 새 수요는 미배정으로 생기므로
 * 전체·미배정 탭이 낡는데, 등록 직후 B-17로 이동하기 때문에 무효화하지 않으면 신선도 시간
 * (전역 60초) 동안 방금 등록한 수요가 목록에 안 보인다.
 *
 * 실패는 `ApiError`로 올라온다. 409(`DEMAND_001`)·404(`PAY_001`) 분기는 호출부(`DemandFormView`)가
 * `error.code`로 한다.
 */
export function useCreateDemand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: DemandCreateRequestDto) => createDemand(request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: DEMAND_QUERY_KEYS.all });
    },
  });
}
