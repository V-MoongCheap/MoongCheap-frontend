'use client';

import { useEffect, useRef } from 'react';

import { useProgressRouter } from '@/hooks/useProgressRouter';
import { cn } from '@/lib/cn';
import type { ActiveRole } from '@/types/user';

// B-26 구매자·판매자 전환 바텀시트. 시안 `453:25295`(구매자 현재상태) · `453:25351`(판매자 현재상태).
//
// AlertDialog와 같은 이유로 네이티브 <dialog>의 showModal()을 쓴다 — 포커스 트랩·Esc 닫힘·
// 백드롭·모달 시맨틱을 브라우저가 준다. 다른 점은 위치뿐이라, UA 기본 `margin: auto` 중앙정렬을
// `mt-auto mb-0`으로 바꿔 바닥에 붙인다.
//
// ⚠️ 역할 전환 API가 없다. '판매자'를 고르면 S-01(판매자 전환)로 보내고, 그 반대 방향
//    (판매자 → 구매자)은 시트를 닫기만 한다. 세션 역할을 바꾸는 엔드포인트가 나오면 채운다.
//
// ⚠️ 기능명세 FN-B26-01은 '판매자 전환'을 `[⚠️ 기능·화면 미확정]`으로 남겨 뒀다. 시안에도 선택
//    결과 화면이 없다. IA 화면목록의 `판매자 전환(역할 승격) → S-01` 매핑을 근거로 삼았다.

/** 시트 문구. 시안 그대로. */
const ROLE_LABELS = { buyer: '구매자', seller: '판매자' } as const;
const CURRENT_BADGE_LABEL = '현재상태';

/**
 * 시안 실측: 높이 48 · 좌우 16 · 상하 12. 라벨은 body-15.
 *
 * 라디오 input이 sr-only라 포커스 표시가 사라진다. 표식은 input의 형제가 아니라 조카여서
 * `peer-focus-visible`(형제 결합자)이 닿지 않으므로, 행 전체에 `has-[:focus-visible]`로 링을
 * 준다(ModeSelectStep과 같은 방식). 키보드로 방향키를 눌렀을 때 어느 행인지 보인다.
 */
const ROW_CLASS =
  'has-[:focus-visible]:ring-effect-focus-ring-primary flex h-12 w-full items-center justify-between px-4 py-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-offset-2';

interface RoleSwitchSheetProps {
  isOpen: boolean;
  /** 지금 쓰고 있는 역할. 이 행에 '현재상태' 배지와 채워진 라디오가 붙는다. */
  currentRole: ActiveRole;
  /**
   * 판매자 전환(S-01) 경로. 아직 판매자가 아닐 때 '판매자'를 고르면 여기로 간다.
   * 도메인 컴포넌트가 라우트 문자열을 들지 않도록 호출부가 넘긴다.
   */
  sellerApplyHref: string;
  /** 닫기 요청(백드롭·Esc·선택 완료). isOpen을 false로 되돌리는 책임이 여기 있다. */
  onClose: () => void;
}

export function RoleSwitchSheet({
  isOpen,
  currentRole,
  sellerApplyHref,
  onClose,
}: RoleSwitchSheetProps) {
  const router = useProgressRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) {
      return;
    }

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // 라디오 값이 실제로 바뀔 때만 불린다. 현재 역할 재선택은 위 input의 onClick이 맡는다.
  function handleSelect(role: ActiveRole) {
    if (role === 'seller') {
      // 판매자 계정이 없으면 승격 화면부터 거친다. 이미 판매자인 경우의 분기는 시안·명세에
      // 근거가 없어 두지 않았다(승격 화면이 상태를 판단한다).
      router.push(sellerApplyHref);
      return;
    }
    // 판매자 → 구매자. 세션 역할을 바꾸는 API가 없어 지금은 닫기만 한다.
    onClose();
  }

  return (
    // 백드롭을 눌러도 닫는다. <dialog>는 백드롭이 자기 영역이라, 클릭 대상이 dialog 자신일 때만
    // 닫아야 시트 내부 클릭을 삼키지 않는다.
    <dialog
      aria-label="계정 전환"
      className="bg-surface-primary rounded-t-12 max-w-mobile backdrop:bg-effect-overlay mx-auto mt-auto mb-0 w-full p-0"
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onClose();
        }
      }}
      onClose={onClose}
      ref={dialogRef}
    >
      <div className="flex w-full flex-col gap-3.75 pb-6">
        {/* 시안 bottom-seat: 101×4 핸들, 상하좌우 16 여백. 장식이라 조작 대상이 아니다. */}
        <div className="flex w-full flex-col items-center p-4">
          <span aria-hidden className="bg-surface-quarternary rounded-round h-1 w-25.25" />
        </div>

        {/* 단일 선택이라 네이티브 라디오를 쓴다. 방향키 이동은 브라우저가 준다(ModeSelectStep과 동일). */}
        <div className="flex w-full flex-col gap-3 px-4">
          {(['buyer', 'seller'] as const).map((role, index) => {
            const selected = role === currentRole;
            return (
              <label
                className={cn(
                  ROW_CLASS,
                  // 시안은 첫 행에만 구분선이 있다.
                  index === 0 && 'border-divider-default border-b',
                )}
                key={role}
              >
                {/* 이미 선택된 라디오를 다시 눌러도 값이 안 바뀌어 onChange가 안 온다.
                    그 경우(현재 역할 재선택)만 onClick으로 받아 닫는다. 선택되지 않은 행은
                    onClick을 달지 않아 onChange와 두 번 실행되지 않는다. */}
                <input
                  checked={selected}
                  className="sr-only"
                  name="role-switch"
                  onChange={() => handleSelect(role)}
                  onClick={selected ? onClose : undefined}
                  type="radio"
                  value={role}
                />
                <span className="text-body-15 text-content-primary">{ROLE_LABELS[role]}</span>

                <span className="flex items-center gap-4">
                  {selected && (
                    <span className="bg-content-brand text-content-oncolor rounded-4 text-label-12 px-2 py-0.5">
                      {CURRENT_BADGE_LABEL}
                    </span>
                  )}
                  {/* 라디오 표식. 시안은 두 상태 모두 회색 링이고 선택 시 안쪽 점만 생긴다. */}
                  <span
                    aria-hidden
                    className="border-border-quarternary rounded-round flex size-6 shrink-0 items-center justify-center border-2"
                  >
                    {selected && <span className="bg-surface-quinary rounded-round size-4" />}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </dialog>
  );
}
