'use client';

import { useEffect, useImperativeHandle, useRef } from 'react';
import type { ReactNode, Ref } from 'react';

// 입력형·확인형 모달의 공용 스캐폴딩. 확인 모달(AlertDialog)과 닉네임 변경 모달이 나란히
// 같은 네이티브 <dialog> 껍데기를 쓰므로, 그 공통부만 이 프리미티브로 뺐다.
//
// 의존성을 늘리지 않으려고 네이티브 <dialog>의 showModal()을 쓴다. 포커스 트랩·Esc 닫힘·
// 백드롭·접근성(모달 시맨틱)이 브라우저 기본으로 제공된다. 공통 UI 프리미티브(shadcn Dialog)
// 규약이 확정되면 이 프리미티브를 그 스캐폴드로 치환하되, 아래 props 계약은 유지한다.
//
// 이 프리미티브가 책임지는 것은 "다이얼로그 동작 + 표면"뿐이다. 내용 레이아웃(제목·본문·버튼 행,
// 여백·gap)은 각 호출부가 children으로 직접 그린다 — 확인 모달과 입력 모달의 내부 구성이 다르기 때문.
//
// 열림 제어는 두 가지 방식을 모두 지원한다.
//   1) open prop 토글(제어 컴포넌트) — 상시 마운트한 채 open으로 여닫는다(AlertDialog).
//   2) open 상수 + 조건부 마운트 — 마운트 시 열고, ref.close()로 닫는다(닉네임 모달).
// 어느 쪽이든 닫힘은 <dialog onClose>가 받아 onClose로 부모에 전달한다.

/** ref로 노출하는 명령형 핸들. 조건부 마운트 방식(닉네임 모달)에서 닫을 때 쓴다. */
export interface DialogHandle {
  /**
   * 네이티브 dialog.close()를 호출해 닫힘 절차(트리거로 포커스 복원)를 태운다.
   * 언마운트만으로는 포커스가 복원되지 않는다. busy 중에는 무시한다(중도 이탈 방지).
   */
  close: () => void;
}

interface DialogProps {
  /**
   * 열림 여부. 제어 방식에서는 이 값을 토글한다. 조건부 마운트 방식에서는 상수 true로 두고
   * ref.close()로 닫는다. 제어 방식에서 닫으려면 onClose에서 이 값을 false로 되돌려야 한다.
   */
  open: boolean;
  /** 닫힘(취소·확인·Esc·백드롭·ref.close) 시 호출. open을 false로 되돌리거나 언마운트하는 책임이 여기 있다. */
  onClose: () => void;
  /**
   * 처리 중 표시. true면 Esc·백드롭 닫힘(onCancel)과 ref.close()를 막아, 파괴적 동작 처리 중
   * 중도 이탈을 원천 차단한다. 버튼 disabled와 함께 쓴다.
   */
  busy?: boolean;
  /** 시맨틱 역할. 확인 모달은 'alertdialog', 입력 모달은 기본(native dialog 역할). */
  role?: 'alertdialog';
  /** 모달의 접근성 이름을 가리키는 요소 id. children 내부의 제목·메시지 id를 넘긴다. */
  'aria-labelledby'?: string;
  /** 보조 설명 요소 id(선택). */
  'aria-describedby'?: string;
  /** 명령형 닫기 핸들(선택). 조건부 마운트 방식(닉네임 모달)에서 ref.close()로 닫을 때 넘긴다. */
  ref?: Ref<DialogHandle>;
  children: ReactNode;
}

// 컨테이너(폭·radius) + 백드롭. 시안 실측값이며 두 모달이 동일하게 쓴다.
const DIALOG_SURFACE_CLASS =
  'bg-surface-primary rounded-32 m-auto w-[calc(100%-54px)] max-w-85 p-0 backdrop:bg-black/40';

// React 19에서 ref는 일반 prop이라 forwardRef 없이 받는다.
export function Dialog({
  open,
  onClose,
  busy = false,
  role,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  ref,
  children,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useImperativeHandle(
    ref,
    () => ({
      close: () => {
        if (!busy) {
          dialogRef.current?.close();
        }
      },
    }),
    [busy],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      // Esc는 close 이전에 취소 가능한 cancel 이벤트를 먼저 던진다. 처리 중에는 여기서 기본
      // 동작(네이티브 dialog 닫힘)을 막아, onClose 가드만으로 남던 React·DOM 상태 불일치
      // (React는 열림·화면은 닫힘)를 원천 차단한다. 버튼 disabled와 함께 중도 이탈을 막는다.
      onCancel={(event) => {
        if (busy) {
          event.preventDefault();
        }
      }}
      role={role}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      className={DIALOG_SURFACE_CLASS}
    >
      {children}
    </dialog>
  );
}

// 2버튼 다이얼로그의 버튼 공통 형태. 시안: height-48 · radius-round · button-15.
// AlertDialog(로그아웃·회원탈퇴)와 닉네임 변경 모달이 나란히 같은 규격을 쓰도록 한곳에서 관리한다.
export const DIALOG_BUTTON_CLASS =
  'text-button-15 focus-visible:ring-effect-focus-ring-primary rounded-round flex h-12 flex-1 items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50';
