'use client';

import { useEffect, useRef } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { ApiError } from '@/lib/api';
import { getMe, logout, updateNickname, withdraw } from '@/lib/authApi';
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
 * 세션을 폐기하는 뮤테이션의 공통 뼈대(#70·#91). `mutationFn`만 다르고 캐시 처리는 같다 —
 * 로그아웃(POST /api/auth/logout)과 회원탈퇴(DELETE /api/auth/withdraw) 모두 성공하면 전역
 * 세션이 미로그인으로 바뀐다는 점에서 캐시 관점의 동작이 동일하다.
 * 화면 이동(로그인 화면으로 replace)은 호출부가 onSuccess에서 맡는다 — 뮤테이션은 상태만 책임진다.
 */
function useSessionClearingMutation(mutationFn: () => Promise<void>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async () => {
      // 진행 중인 세션 조회를 먼저 취소한다. setQueryData는 in-flight 요청을 막지 못해,
      // 유효 쿠키로 이미 떠난 getMe가 세션 폐기 뒤 늦게 도착하면 null 캐시를 예전 유저로
      // 되돌릴 수 있다(경합). 취소로 그 응답이 캐시에 반영되지 않게 한다.
      await queryClient.cancelQueries({ queryKey: SESSION_QUERY_KEY });
    },
    onSuccess: () => {
      // 🔒 세션이 끝나면 **모든** 조회 캐시를 버린다. QueryClient는 앱 루트(`app/providers.tsx`)에
      // 한 번 만들어져 클라이언트 이동 내내 살아 있고, 로그아웃은 문서를 다시 로드하지 않는다.
      // 세션만 null로 바꾸면 배송지(주소·받는 사람·공동현관 출입번호)·주문 같은 개인 정보가
      // 캐시에 그대로 남아, 로그아웃 뒤나 같은 기기에서 다른 계정으로 들어갔을 때 이전 사용자의
      // 데이터가 잠깐 그려진다.
      //
      // 키를 하나씩 지우지 않는 이유는 조회가 늘 때마다 여기에 추가하는 것을 잊기 때문이다.
      // 통째로 버리고 세션만 다시 세운다.
      queryClient.clear();
      // 세션을 null로 바꿔 전역 상태를 미로그인으로 만든다. 재요청(invalidate)이 아니라 직접
      // 세팅하는 이유는, 쿠키가 이미 폐기돼 재조회해도 결과가 null이라 왕복이 불필요하기 때문이다.
      // `clear()` 뒤에 세팅해야 한다. 순서를 바꾸면 방금 세운 null까지 함께 지워진다.
      queryClient.setQueryData(SESSION_QUERY_KEY, null);
    },
  });
}

/**
 * 로그인이 필요한 조회가 401(세션 만료·쿠키 없음)로 실패하면 로그인 화면으로 보낸다(#159).
 *
 * 401은 다시 조회해도 같은 결과라 '다시 시도' 오류 화면을 띄우면 유저가 갇힌다. 그래서 전역 세션을
 * 미로그인(null)으로 맞추고 로그인 화면으로 replace 한다(뒤로가기로 오류 화면에 돌아오지 않게).
 * 렌더 중 이동은 안 되므로 effect에서 처리한다.
 *
 * 반환값은 "지금 로그인 화면으로 보내는 중인지"다. 호출부는 이 동안 오류 화면 대신 자리표시자를
 * 그려 깜빡임을 막는다(`SessionProfileCard`와 같은 방침).
 */
export function useRedirectOnUnauthorized(error: Error | null): boolean {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isUnauthorized = error instanceof ApiError && error.status === 401;
  // 한 번만 처리한다. `clear()`가 지금 떠 있는 목록 쿼리까지 지워, 이동 전에 다시 그려지면 쿼리가
  // 새로 만들어져 재조회 → 또 401 → 또 clear로 반복될 수 있다.
  const handledRef = useRef(false);

  useEffect(() => {
    if (!isUnauthorized || handledRef.current) {
      return;
    }
    handledRef.current = true;
    // 🔒 로그아웃과 같은 이유로 조회 캐시를 통째로 버린다(`useSessionClearingMutation` 참고).
    // 만료된 계정의 주문·참여·배송지가 캐시에 남으면 같은 기기에서 다른 계정으로 로그인했을 때
    // 잠깐 그려진다. `clear()` 뒤에 세션을 세워야 null까지 지워지지 않는다.
    queryClient.clear();
    queryClient.setQueryData(SESSION_QUERY_KEY, null);
    router.replace('/login');
  }, [isUnauthorized, queryClient, router]);

  return isUnauthorized;
}

/** 로그아웃 뮤테이션(#70). `POST /api/auth/logout`으로 세션을 폐기한다. */
export function useLogout() {
  return useSessionClearingMutation(logout);
}

/** 회원 탈퇴 뮤테이션(#91). `DELETE /api/auth/withdraw`로 계정을 탈퇴하고 세션을 폐기한다. */
export function useWithdraw() {
  return useSessionClearingMutation(withdraw);
}

/**
 * 닉네임 변경 뮤테이션(#92). 성공 시 세션 캐시를 무효화해 getMe를 재조회한다.
 *
 * 로그아웃과 달리 낙관적 setQueryData를 쓰지 않는 이유는, 백엔드가 닉네임을 정규화(normalize→key)해
 * 저장하므로 입력값과 저장값이 다를 수 있기 때문이다. 저장된 실제 값을 다시 받아 프로필 카드에
 * 반영한다. 화면 이동은 없고(모달만 닫힌다) 상태 갱신만 책임진다.
 */
export function useUpdateNickname() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (nickname: string) => updateNickname(nickname),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
    },
  });
}
