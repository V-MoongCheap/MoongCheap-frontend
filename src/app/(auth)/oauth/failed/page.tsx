import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getOAuthFailureMessage } from '@/constants/authMessages';
import { isStaleAuthorizationRequest } from '@/lib/oauth';

export const metadata: Metadata = {
  title: '로그인 실패',
};

// 소셜 로그인(카카오·구글) 실패 착지 경로. 백엔드가 실패 시 `/oauth/failed?reason=...`로 리다이렉트한다.
// reason은 서버 예외 메시지 원문이라(안정 코드 아님) 노출하지 않고 일반 문구로만 안내한다
// (constants/authMessages 참고). 다시 로그인으로 되돌린다.
//
// 단, 로그아웃 뒤 뒤로 가기로 옛 인가 흐름에 다시 들어온 경우는 로그인 실패가 아니라 로그인 화면으로
// 보낸다(#156, `isStaleAuthorizationRequest` 참고). 서버 redirect라 이 화면은 방문 기록에 남지 않는다.
export default async function OAuthFailedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string | string[] }>;
}) {
  const { reason } = await searchParams;
  if (isStaleAuthorizationRequest(Array.isArray(reason) ? reason[0] : reason)) {
    redirect('/login');
  }

  const message = getOAuthFailureMessage();

  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl leading-snug font-bold">로그인에 실패했어요</h1>
        <p className="text-content-quarternary text-sm">{message}</p>
      </div>

      <Link
        href="/login"
        className="bg-surface-button-primary-default hover:bg-surface-button-primary-hover active:bg-surface-button-primary-pressed text-content-oncolor rounded-8 flex h-13 w-full items-center justify-center font-medium"
      >
        다시 로그인하기
      </Link>
    </div>
  );
}
