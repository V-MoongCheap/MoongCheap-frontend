import Link from 'next/link';

import { ComingSoonButton } from '@/components/ui/ComingSoonButton';

// 시안의 quarternary 버튼(연회색 바탕 + 얇은 테두리)을 링크로 쓴 것.
// B-26의 "취소/교환/반품 조회", B-24의 "프로필 사진 변경"·"닉네임 변경"이 같은 모양이다.
//
// 공용 프리미티브(`components/ui/Button`)로 올리지 않는 이유는 아직 이 한 가지 변형만
// 쓰이기 때문이다. 두 번째 변형(primary 등)이 실제로 필요해질 때 함께 올린다.
//
// `href`가 없으면 MVP 미구현 진입점으로 보고 '준비 중' 토스트를 띄운다. 세 호출부가 전부
// 아직 화면이 없는 곳을 가리켜서, 링크로 두면 404가 난다.

interface LinkButtonProps {
  label: string;
  /** 이동 경로. 없으면 '준비 중' 토스트를 띄운다. */
  href?: string;
}

/** quarternary 링크 버튼의 생김새. 같은 행에 놓이는 액션 버튼(NicknameChangeButton)이 모양을
 *  맞추도록 내보낸다. */
export const LINK_BUTTON_CLASS =
  'bg-surface-button-quarternary-default border-border-button-quarternary text-button-14 text-content-primary rounded-8 active:bg-surface-button-quarternary-pressed flex h-11 w-full flex-1 items-center justify-center border px-3 text-center';

export function LinkButton({ label, href }: LinkButtonProps) {
  if (href === undefined) {
    return <ComingSoonButton className={LINK_BUTTON_CLASS}>{label}</ComingSoonButton>;
  }

  return (
    <Link className={LINK_BUTTON_CLASS} href={href}>
      {label}
    </Link>
  );
}
