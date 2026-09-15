'use client';

import { useState } from 'react';

import { ArrowLeftRight } from 'lucide-react';

import { ROLE_SWITCH_CLASS } from '@/features/user/components/ProfileCard';
import { RoleSwitchSheet } from '@/features/user/components/RoleSwitchSheet';
import type { ActiveRole } from '@/types/user';

// 마이페이지 프로필 카드의 역할 전환 버튼(B-26). 시트 열림 상태만 들고 있는 얇은 client 조각이라
// `mypage/page.tsx`는 서버 컴포넌트로 남는다(ComingSoonButton·LogoutRow와 같은 방식).
//
// 라벨은 "지금이 아닌 쪽"을 가리킨다 — 구매자면 '판매자 전환', 판매자면 '구매자 전환'.
// 시안 `453:25351`(판매자 현재상태)의 pill은 '판매자 전환'으로 그려져 있으나, S-01 전환완료
// 화면의 미리보기(`453:25144`)는 판매자 계정에 '구매자 전환'을 달고 있다. 뒤쪽을 따랐다.

// Record로 두면 역할이 늘었을 때 라벨 누락을 컴파일러가 잡는다.
const SWITCH_LABELS: Record<ActiveRole, string> = {
  buyer: '판매자 전환',
  seller: '구매자 전환',
};

interface RoleSwitchButtonProps {
  currentRole: ActiveRole;
  /** 판매자 전환(S-01) 경로. 시트가 '판매자' 선택 시 쓴다. */
  sellerApplyHref: string;
}

export function RoleSwitchButton({ currentRole, sellerApplyHref }: RoleSwitchButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button className={ROLE_SWITCH_CLASS} onClick={() => setIsOpen(true)} type="button">
        <ArrowLeftRight aria-hidden className="size-4" />
        {SWITCH_LABELS[currentRole]}
      </button>

      <RoleSwitchSheet
        currentRole={currentRole}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        sellerApplyHref={sellerApplyHref}
      />
    </>
  );
}
