'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { deleteAddress, getAddress, getAddresses, setDefaultAddress } from '@/lib/addressApi';
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
  /** 목록·단건 전부. 수정은 둘 다 낡게 만들어 접두 키로 한 번에 버린다. */
  all: ['addresses'] as const,
  list: ['addresses', 'list'] as const,
  detail: (id: string) => ['addresses', 'detail', id] as const,
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

  // 재조회 중에는 직전 오류를 감춘다. Query는 새 결과가 올 때까지 error를 들고 있는데, 그대로
  // 올리면 오류 화면이 그 자리에 남아 재시도 버튼이 먹통처럼 보인다. 감추면 목록이 아직 없는
  // 상태라 호출부가 스켈레톤을 그린다(옮기기 전 동작과 같다).
  const settledError = error !== null && !isFetching ? toApiError(error) : null;

  return {
    // 실패하면 null이다(JSDoc의 계약). Query는 재조회가 실패해도 직전 목록을 들고 있는데, 그것을
    // 그대로 올리면 서버에서 지워진 배송지가 계속 보인다. `AddressSection`이 error를 읽지 않아
    // 카드를 그대로 그리는 자리다(그 파일은 조회 실패를 '배송지 없음'으로 보기로 했다).
    //
    // 성공하는 재조회 중에는 직전 목록을 유지한다. 여기서 null로 만들면 등록 후 무효화·창 포커스
    // 복귀마다 목록이 깜빡이고, `AddressCreateView`가 언마운트돼 입력 중인 폼 값이 사라진다.
    addresses: settledError !== null ? null : (data ?? null),
    // 첫 조회만 로딩으로 본다. 이미 받아 둔 목록이 있으면 재조회 중에도 그것을 그대로 보여 준다.
    isLoading: isPending,
    error: settledError,
    // 호출부는 반환값을 쓰지 않는다. 계약을 그대로 두려고 Promise를 삼킨다.
    refetch: () => {
      void refetch();
    },
  };
}

export interface AddressState {
  /** 조회 전·실패 시 null. */
  address: Address | null;
  isLoading: boolean;
  /** 조회 실패 사유. 404(`SHIP_001`)·403(`SHIP_003`)은 화면이 재시도 없이 안내한다. */
  error: ApiError | null;
  refetch: () => void;
}

/**
 * 배송지 단건 조회 상태(B-30 수정 화면). 목록과 달리 전화번호가 마스킹되지 않은 원본으로 온다.
 *
 * 목록 훅과 달리 재조회가 실패해도 받아 둔 값을 버리지 않는다. 이 값은 폼의 초기값으로 한 번
 * 쓰이고 끝나는데, null로 바꾸면 호출부가 오류 화면으로 갈아 끼우면서 입력 중인 폼이 사라진다.
 */
export function useAddress(id: string): AddressState {
  const { data, isPending, isFetching, error, refetch } = useQuery({
    queryKey: ADDRESS_QUERY_KEYS.detail(id),
    queryFn: () => getAddress(id),
    retry: shouldRetryQuery,
  });

  return {
    address: data ?? null,
    isLoading: isPending,
    error: error !== null && !isFetching ? toApiError(error) : null,
    refetch: () => {
      void refetch();
    },
  };
}

/**
 * 기본 배송지 지정 뮤테이션(#129). `PATCH /api/shipping-addresses/{id}/default`.
 *
 * 성공 시 목록 캐시를 무효화해 다시 받는다. 낙관적 업데이트를 쓰지 않는 이유는, 기본 해제·지정이
 * 서버에서 한 트랜잭션이라 두 카드의 `isDefault`가 동시에 바뀌기 때문이다. 프론트에서 흉내 내면
 * 실패 시 되돌릴 상태가 복잡해지고, 재조회 한 번이면 정렬(기본 우선)까지 서버 기준으로 맞는다.
 *
 * `variables`(지정 대상 id)로 어느 카드가 처리 중인지 호출부가 구분한다.
 */
export function useSetDefaultAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => setDefaultAddress(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ADDRESS_QUERY_KEYS.list });
    },
  });
}

/**
 * 배송지 삭제 뮤테이션(#129). `DELETE /api/shipping-addresses/{id}`.
 *
 * 성공 시 목록 캐시를 무효화한다. 지운 것이 기본이었고 다른 배송지가 남으면 백엔드가 자동 승격하므로
 * (`addressApi.ts` 참고), 낙관적으로 카드만 지우면 승격된 새 기본이 반영되지 않는다. 재조회로 맞춘다.
 */
export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAddress(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ADDRESS_QUERY_KEYS.list });
    },
  });
}
