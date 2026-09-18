'use client';

import { useQuery } from '@tanstack/react-query';

import { getAddresses } from '@/lib/addressApi';
import { ApiError } from '@/lib/api';
import { shouldRetryQuery } from '@/lib/queryRetry';
import type { Address } from '@/types/address';

/**
 * 배송지 목록 조회 상태.
 *
 * 서버 컴포넌트에서 부를 수 없어 훅으로 둔다. 세션이 SID **httpOnly 쿠키**라 브라우저가 요청에
 * 자동으로 실어 보내는데, Next 서버에는 그 쿠키 저장소가 없다. 서버 컴포넌트에서 호출하면
 * 쿠키 없이 나가 401이 된다.
 *
 * 소비처가 셋이다(배송지 목록 B-30 · 배송지 등록 · 수요 등록 폼 B-09의 배송지 섹션). 같은
 * 화면에 둘이 함께 뜨는 경우가 있어, Query가 키로 요청을 병합하고 캐시를 공유한다.
 */

/** 배송지 캐시 키. 등록·수정 후 무효화할 때도 이 키를 쓴다(`useOrders`의 키 표와 같은 방식). */
export const ADDRESS_QUERY_KEYS = {
  list: ['addresses', 'list'] as const,
};

export interface AddressesState {
  /** 조회 전·실패 시 null. 성공하면 배열(0건이면 빈 배열)이다. */
  addresses: Address[] | null;
  isLoading: boolean;
  /** 조회 실패 사유. 화면이 문구를 고르도록 ApiError 그대로 올린다. */
  error: ApiError | null;
  refetch: () => void;
}

/** apiFetch는 네트워크 오류·미배선까지 ApiError로 감싸지만, 그 밖의 예외도 형태를 맞춘다. */
function toApiError(caught: unknown): ApiError {
  return caught instanceof ApiError ? caught : new ApiError('배송지를 불러오지 못했습니다.', 0);
}

export function useAddresses(): AddressesState {
  const { data, isPending, isFetching, error, refetch } = useQuery({
    queryKey: ADDRESS_QUERY_KEYS.list,
    queryFn: getAddresses,
    retry: shouldRetryQuery,
  });

  return {
    addresses: data ?? null,
    // 첫 조회만 로딩으로 본다. 이미 받아 둔 목록이 있으면 재조회 중에도 그것을 그대로 보여 준다.
    isLoading: isPending,
    // 재조회 중에는 직전 오류를 감춘다. Query는 새 결과가 올 때까지 error를 들고 있는데, 그대로
    // 올리면 오류 화면이 그 자리에 남아 재시도 버튼이 먹통처럼 보인다. 감추면 목록이 아직 없는
    // 상태라 호출부가 스켈레톤을 그린다(옮기기 전 동작과 같다).
    error: error === null || isFetching ? null : toApiError(error),
    // 호출부는 반환값을 쓰지 않는다. 계약을 그대로 두려고 Promise를 삼킨다.
    refetch: () => {
      void refetch();
    },
  };
}
