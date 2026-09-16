import Image from 'next/image';
import Link from 'next/link';

import { SIGNUP_ASSETS } from '@/constants/assets';

import { ScreenColumn } from './ScreenColumn';

// 회원가입 완료 축하 화면(Figma 10.가입완료 / B-01). 제목·일러스트는 상단, CTA는 하단 고정
// (앞 입력 스텝과 동일한 ScreenColumn + mt-auto 패턴이라 스텝 간 버튼 위치가 튀지 않는다).
//
// 로컬 위저드(/signup, 잠정 보관)와 소셜 완료(/oauth/complete, 실 플로우)가 공유한다. 두 진입의
// 차이는 CTA뿐이다: 로컬 가입은 자동로그인을 하지 않아 로그인 화면으로 보내고("로그인하러가기"),
// 소셜은 완료 시점에 이미 세션이 발급돼 있어 바로 앱으로 들어간다("뭉치 시작하기" → 홈).
//
// 일러스트는 Figma 최종 확정 3D(인물 카드 + 코랄 체크 + 반짝이). 제목이 완료를 알리므로 삽화는
// 장식으로 두고 alt는 빈다. 투명 WebP라 라이트·다크 모두에서 그대로 쓴다(테마별 파일 스왑 불필요).

interface SignupCompleteScreenProps {
  /** 하단 CTA 라벨. */
  ctaLabel: string;
  /** CTA 목적지 경로. */
  ctaHref: string;
  /** 히스토리를 남기지 않고 이동한다(뒤로가기로 완료 화면에 재진입하지 않게). 소셜 완료에서 쓴다. */
  replace?: boolean;
}

export function SignupCompleteScreen({
  ctaLabel,
  ctaHref,
  replace = false,
}: SignupCompleteScreenProps) {
  return (
    <ScreenColumn>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-heading-20">가입이 완료되었습니다!</h1>
          <p className="text-content-quarternary text-body-14">뭉치와 함께 알뜰한 쇼핑하세요</p>
        </div>

        <div className="flex justify-center">
          <Image src={SIGNUP_ASSETS.complete} alt="" width={240} height={204} priority />
        </div>
      </div>

      <Link
        href={ctaHref}
        replace={replace}
        className="bg-surface-button-tertiary-default hover:bg-surface-button-tertiary-hover active:bg-surface-button-tertiary-pressed text-content-inverse focus-visible:ring-effect-focus-ring-primary rounded-8 text-button-15 mt-auto flex h-13 items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        {ctaLabel}
      </Link>
    </ScreenColumn>
  );
}
