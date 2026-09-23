'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@/lib/api';
import { getPaymentMethods, setDefaultPaymentMethod } from '@/lib/paymentApi';
import { shouldRetryQuery } from '@/lib/queryRetry';
import type { PaymentMethod } from '@/types/payment';

/**
 * 결제수단 목록 조회 상태.
 *
 * `useAddresses`와 같은 구조다. 세션이 SID httpOnly 쿠키라 서버 컴포넌트에서 부르면 쿠키 없이
 * 나가 401이 된다. 그래서 훅으로 두고 client에서 부른다.
 *
 * 소비처는 B-14 결제수단 관리(`PaymentMethodManager`)와 B-09 수요 등록의 결제수단 영역이다.
 * 같은 키를 써서 B-14에서 기본을 바꾸고 돌아오면 B-09도 바뀐 기본을 그린다.
 */

/** 결제수단 캐시 키. 기본 변경 후 무효화할 때도 이 키를 쓴다. */
export const PAYMENT_METHOD_QUERY_KEYS = {
  list: ['paymentMethods', 'list'] as const,
};

export interface PaymentMethodsState {
  /** 조회 전·실패 시 null. 성공하면 배열(0건이면 빈 배열)이다. */
  methods: PaymentMethod[] | null;
  isLoading: boolean;
  /** 조회 실패 사유. 화면이 문구를 고르도록 ApiError 그대로 올린다. */
  error: ApiError | null;
  refetch: () => void;
}

/** apiFetch는 네트워크 오류·미배선까지 ApiError로 감싸지만, 그 밖의 예외도 형태를 맞춘다. */
function toApiError(caught: unknown): ApiError {
  return caught instanceof ApiError ? caught : new ApiError('결제수단을 불러오지 못했습니다.', 0);
}

export function usePaymentMethods(): PaymentMethodsState {
  const { data, isPending, isFetching, error, refetch } = useQuery({
    queryKey: PAYMENT_METHOD_QUERY_KEYS.list,
    queryFn: getPaymentMethods,
    retry: shouldRetryQuery,
  });

  // 재조회 중에는 직전 오류를 감춘다. 그대로 올리면 '다시 시도'를 눌러도 오류 화면이 남아
  // 버튼이 먹통처럼 보인다(`useAddresses`와 같은 처리).
  const settledError = error !== null && !isFetching ? toApiError(error) : null;

  return {
    // 실패하면 null이다. 재조회가 실패했는데 직전 목록을 그대로 올리면 이미 삭제·비활성된
    // 결제수단으로 수요를 등록하려 할 수 있다.
    methods: settledError !== null ? null : (data ?? null),
    isLoading: isPending,
    error: settledError,
    refetch: () => {
      void refetch();
    },
  };
}

/**
 * 기본 결제수단 지정 뮤테이션. `PATCH /api/payments/methods/{id}/default`.
 *
 * 성공 시 목록 캐시를 무효화해 다시 받는다(FN-B14-01 "변경 성공 시 목록 재조회 1회"). 기본 해제와
 * 지정이 서버에서 한 번에 일어나고 정렬(기본 우선)도 서버가 하므로, 낙관적 업데이트 없이 재조회로
 * 맞춘다(`useSetDefaultAddress`와 같은 이유).
 */
export function useSetDefaultPaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => setDefaultPaymentMethod(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PAYMENT_METHOD_QUERY_KEYS.list });
    },
  });
}
