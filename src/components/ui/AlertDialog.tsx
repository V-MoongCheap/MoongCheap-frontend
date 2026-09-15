'use client';

import { useEffect, useId, useRef } from 'react';

import { Button } from '@/components/ui/Button';
import { DIALOG_BUTTON_CLASS } from '@/components/ui/dialog';

// 알림·확인 모달. Figma `ios-popup-2button` 시안(453:25498)에 대응한다.
//
// 의존성을 늘리지 않으려고 네이티브 <dialog>의 showModal()을 쓴다. 포커스 트랩·Esc 닫힘·
// 백드롭·접근성(모달 시맨틱)이 브라우저 기본으로 제공된다. 공통 UI 프리미티브(shadcn Dialog)
// 규약이 확정되면 이 컴포넌트를 그 스캐폴드로 치환하되, 아래 props 계약은 유지한다.
//
// 버튼 수는 onConfirm 유무로 갈린다.
//   없음  알림 1버튼. 확인을 누르면 닫기만 한다(로그인 실패 안내 등).
//   있음  확인 2버튼. [취소][실행] 구성이며 실행은 파괴적 동작(로그아웃·회원탈퇴)이다.
//
// 컨테이너(폭·radius·타이포)는 시안 실측값이다. 안쪽 여백이 20인 근거는, 시안 프레임이 298로
// 잡혀 있으나 그 안의 버튼 행이 300(x=-1)이라 프레임 쪽이 반올림 아티팩트이고
// `340 - 20×2 = 300`이 정확히 맞아떨어지기 때문이다.
//
// 버튼 공통 형태(DIALOG_BUTTON_CLASS)는 닉네임 변경 모달과 나란히 쓰이므로 `components/ui/dialog`로 뺐다.

interface AlertDialogProps {
  /**
   * 열림 여부(제어 컴포넌트). onClose에서 반드시 이 값을 false로 되돌려야 한다.
   * 그렇지 않으면 Esc·확인으로 닫아도 isOpen이 true로 남아, 재렌더 시 effect가 다시 열어버린다.
   */
  isOpen: boolean;
  /** 본문 메시지. 화면에 보이는 핵심 문구이자, 제목이 없을 땐 모달의 접근성 이름으로도 쓰인다. */
  message: string;
  /** 제목(선택). 시안의 "[에러 메시지]" 자리. */
  title?: string;
  /** 실행 버튼 라벨. */
  confirmLabel?: string;
  /**
   * 실행 콜백. 넘기면 2버튼 구성이 된다.
   * 닫는 책임은 호출부에 있다 — 이 함수 안에서 isOpen을 false로 되돌린다.
   */
  onConfirm?: () => void;
  /** 2버튼 구성의 취소 라벨. */
  cancelLabel?: string;
  /** 처리 중 두 버튼을 비활성화한다(FN-B24-02 화면 상태 "처리 중: 다이얼로그 버튼 비활성"). */
  isProcessing?: boolean;
  /** 닫기 요청(취소·확인·Esc) 시 호출. isOpen을 false로 되돌리는 책임이 여기 있다. */
  onClose: () => void;
}

export function AlertDialog({
  isOpen,
  message,
  title,
  confirmLabel = '확인',
  onConfirm,
  cancelLabel = '돌아가기',
  isProcessing = false,
  onClose,
}: AlertDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // 한 화면에 인스턴스가 여럿 뜬다(B-24의 로그아웃·회원탈퇴). ID를 고정하면 문서에 중복이
  // 생겨 aria-labelledby가 다른 다이얼로그의 문구를 가리킬 수 있다. useId는 SSR·CSR 값이
  // 일치하도록 React가 보장하므로 하이드레이션 경고도 나지 않는다.
  const id = useId();
  const titleId = `${id}-title`;
  const messageId = `${id}-message`;

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

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      // Esc는 close 이전에 취소 가능한 cancel 이벤트를 먼저 던진다. 처리 중에는 여기서 기본
      // 동작(네이티브 dialog 닫힘)을 막아, onClose 가드만으로 남던 React·DOM 상태 불일치
      // (React는 열림·화면은 닫힘)를 원천 차단한다. 버튼 disabled와 함께 중도 이탈을 막는다.
      onCancel={(event) => {
        if (isProcessing) {
          event.preventDefault();
        }
      }}
      role="alertdialog"
      // 제목이 있으면 제목이 이름, 없으면 메시지를 이름으로 삼아 모달에 항상 접근성 이름을 준다.
      aria-labelledby={title !== undefined ? titleId : messageId}
      aria-describedby={title !== undefined ? messageId : undefined}
      className="bg-surface-primary rounded-32 m-auto w-[calc(100%-54px)] max-w-85 p-0 backdrop:bg-black/40"
    >
      <div className="flex flex-col gap-3 p-5">
        <div className="flex flex-col gap-2">
          {title !== undefined && (
            <p className="text-title-17 text-content-primary" id={titleId}>
              {title}
            </p>
          )}
          <p className="text-body-14 text-content-quarternary" id={messageId}>
            {message}
          </p>
        </div>

        {/* 모달이 열리면 브라우저가 첫 버튼에 자동 포커스한다. 2버튼 구성에서는 그게 취소라,
            파괴적 동작이 Enter 한 번으로 실행되지 않는다. */}
        {/* 키보드 포커스는 focus-visible 링으로 위치를 알려 준다(마우스 클릭 시엔 안 보여 시안을 해치지 않는다). */}
        {onConfirm === undefined ? (
          // 1버튼 알림. 시안이 2버튼 구성만 있어 기존 형태를 그대로 둔다.
          // 굵기를 여기서 지정한다. Button base는 글자 굵기를 깔지 않는다(타이포 토큰의 weight를
          // 덮어버리기 때문). 500은 이 버튼의 기존 렌더값을 그대로 유지한 것이다.
          <Button className="h-12 font-medium" onClick={onClose}>
            {confirmLabel}
          </Button>
        ) : (
          <div className="flex gap-2">
            <button
              className={`${DIALOG_BUTTON_CLASS} border-border-button-quarternary bg-background-default hover:bg-surface-button-quarternary-hover active:bg-surface-button-quarternary-pressed text-content-primary border`}
              disabled={isProcessing}
              onClick={onClose}
              type="button"
            >
              {cancelLabel}
            </button>
            <button
              className={`${DIALOG_BUTTON_CLASS} bg-surface-danger text-content-oncolor`}
              disabled={isProcessing}
              onClick={onConfirm}
              type="button"
            >
              {confirmLabel}
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
}
