import type { Metadata } from 'next';

import { SocialSignupCompletion } from '../../_components/SocialSignupCompletion';

export const metadata: Metadata = {
  title: '소셜 로그인 완료',
};

// 소셜 최초 로그인 완료 경로(#18). 콜백이 `?status=incomplete`(약관 미동의=최초 유저)를 여기로 보낸다.
// 약관 동의 + 닉네임을 받아 가입을 확정한다. 상세는 SocialSignupCompletion 참고.
export default function OAuthCompletePage() {
  return <SocialSignupCompletion />;
}
