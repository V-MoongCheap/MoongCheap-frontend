'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getMe, logout, withdraw } from '@/lib/authApi';
import type { SessionUser } from '@/types/auth';

// 전역 로그인 상태(#70). TanStack Query 캐시의 ['session'] 키가 곧 전역 세션 상태다 —
// useSession을 호출하는 어느 컴포넌트든 같은 캐시를 공유하고(중복 요청은 Query가 병합),
// 로그아웃이 그 캐시를 비운다. 별도 스토어를 두지 않는 이유는 세션이 서버 상태이기 때문이다.

export const SESSION_QUERY_KEY = ['session'] as const;

interface UseSessionResult {
  /** 로그인 상태면 회원 정보, 미로그인이면 null, 첫 조회 중이면 undefined. */
  user: SessionUser | null | undefined;
  isAuthenticated: boolean;
  /** 첫 세션 조회 중(캐시 없음). 자리표시자(Skeleton)를 띄우는 신호. */
  isPending: boolean;
  /** 미로그인(→null)이 아니라 조회 자체가 실패(네트워크·5xx). */
  isError: boolean;
  refetch: () => void;
}

export function useSession(): UseSessionResult {
  const query = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: getMe,
    // 미로그인(getMe가 null 반환)은 정상 결과라 재시도 대상이 아니고, 그 외 오류도 로그인
    // 판정을 늦추지 않도록 재시도하지 않는다.
    retry: false,
  });

  return {
    user: query.data,
    isAuthenticated: query.data != null,
    isPending: query.isPending,
    isError: query.isError,
    refetch: () => {
      void query.refetch();
    },
  };
}

/**
 * 로그아웃 뮤테이션. 성공 시 세션 캐시를 비워 전역 상태를 즉시 미로그인으로 만든다.
 * 화면 이동(로그인 화면으로 replace)은 호출부가 onSuccess에서 맡는다 — 뮤테이션은 상태만 책임진다.
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onMutate: async () => {
      // 진행 중인 세션 조회를 먼저 취소한다. setQueryData는 in-flight 요청을 막지 못해,
      // 유효 쿠키로 이미 떠난 getMe가 로그아웃 뒤 늦게 도착하면 null 캐시를 예전 유저로
      // 되돌릴 수 있다(경합). 취소로 그 응답이 캐시에 반영되지 않게 한다.
      await queryClient.cancelQueries({ queryKey: SESSION_QUERY_KEY });
    },
    onSuccess: () => {
      // 세션을 null로 바꿔 전역 상태를 미로그인으로 만든다. 재요청(invalidate)이 아니라 직접
      // 세팅하는 이유는, 쿠키가 이미 폐기돼 재조회해도 결과가 null이라 왕복이 불필요하기 때문이다.
      queryClient.setQueryData(SESSION_QUERY_KEY, null);
    },
  });
}

/**
 * 회원 탈퇴 뮤테이션(#91). 백엔드가 계정을 탈퇴 처리하고 세션을 폐기하면, 로그아웃과 똑같이
 * 세션 캐시를 비워 전역 상태를 즉시 미로그인으로 만든다(캐시 관점에선 로그아웃과 동일하다).
 * 화면 이동(로그인 화면으로 replace)은 호출부가 onSuccess에서 맡는다 — 뮤테이션은 상태만 책임진다.
 */
export function useWithdraw() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: withdraw,
    onMutate: async () => {
      // 진행 중인 세션 조회를 취소한다(로그아웃과 같은 경합 방지). 유효 쿠키로 이미 떠난 getMe가
      // 탈퇴 뒤 늦게 도착하면 null 캐시를 예전 유저로 되돌릴 수 있다.
      await queryClient.cancelQueries({ queryKey: SESSION_QUERY_KEY });
    },
    onSuccess: () => {
      queryClient.setQueryData(SESSION_QUERY_KEY, null);
    },
  });
}
