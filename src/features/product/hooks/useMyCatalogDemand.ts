'use client';

import { skipToken, useQuery } from '@tanstack/react-query';

import { useSession } from '@/features/auth/session';
import { DEMAND_QUERY_KEYS } from '@/features/participation/hooks/useMyDemands';
import { fetchMyActiveDemandStatus } from '@/lib/demandApi';
import { shouldRetryQuery } from '@/lib/queryRetry';
import type { DemandStatusDto } from '@/types/api/demand';

// B-08 상품 상세 하단 CTA가 쓰는 '이 상품에 대한 내 진행 중 수요'(#191·#192).
//
// 캐시 키를 참여 목록(`DEMAND_QUERY_KEYS.all`) 아래에 둔다. 수요 등록(B-09)·퀵 참여(B-12)가 성공하면
// 그 접두 키를 무효화하므로, 참여 직후 상품 상세로 돌아오면 CTA가 바로 바뀐다.

/**
 * CTA 분기. `none`은 참여 전(기본 '뭉치 참여하기'), 나머지는 내 대기(B-17)로 보낸다.
 *
 * - `participating`: 보드에 편입됨(`ASSIGNED`)·낙찰 후 결제 대기(`PAYMENT_PENDING`) — #191
 * - `received`: 접수만 되고 아직 보드 미배정(`UNASSIGNED`) — #192
 * - `actionRequired`: 대체상품 제안 확인 필요(`SUBSTITUTE_OFFERED`). 명세 문구 미정
 */
export type MyCatalogDemandCta = 'none' | 'participating' | 'received' | 'actionRequired';

const CTA_BY_STATUS: Partial<Record<DemandStatusDto, MyCatalogDemandCta>> = {
  ASSIGNED: 'participating',
  PAYMENT_PENDING: 'participating',
  UNASSIGNED: 'received',
  SUBSTITUTE_OFFERED: 'actionRequired',
};

/**
 * 이 상품의 CTA 분기. 조회 전·실패·미로그인·mock 상품(도감 id 없음)이면 `none`이다.
 *
 * 상품 상세는 로그인 없이도 보는 화면이라 **미로그인이면 조회하지 않는다**(401을 만들지도, 로그인으로
 * 보내지도 않는다). 조회가 실패해도 기본 CTA로 두고, 제출 시점의 409(`DEMAND_001`)가 최종 방어선이다.
 */
export function useMyCatalogDemandCta(catalogId: number | null): MyCatalogDemandCta {
  const { isAuthenticated } = useSession();
  const enabled = isAuthenticated && catalogId !== null;

  const { data } = useQuery({
    queryKey: [...DEMAND_QUERY_KEYS.all, 'catalog', catalogId] as const,
    queryFn:
      isAuthenticated && catalogId !== null
        ? () => fetchMyActiveDemandStatus(catalogId)
        : skipToken,
    retry: shouldRetryQuery,
  });

  if (!enabled || data === undefined || data === null) {
    return 'none';
  }
  return CTA_BY_STATUS[data] ?? 'none';
}
