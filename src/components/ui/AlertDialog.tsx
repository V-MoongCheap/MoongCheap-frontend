'use client';

import { useId } from 'react';

import { Button } from '@/components/ui/Button';
import { Dialog, DIALOG_BUTTON_CLASS } from '@/components/ui/Dialog';

// 알림·확인 모달. Figma `ios-popup-2button` 시안(453:25498)에 대응한다.
//
// 네이티브 <dialog> 스캐폴딩(showModal·onCancel 가드·표면·백드롭·onClose 전달)은 공용
// 프리미티브 Dialog로 뺐고(#102), 여기서는 확인/알림 내용 구성만 담당한다.
//
// 버튼 수는 onConfirm 유무로 갈린다.
//   없음  알림 1버튼. 확인을 누르면 닫기만 한다(로그인 실패 안내 등).
//   있음  확인 2버튼. [취소][실행] 구성이며 실행은 파괴적 동작(로그아웃·회원탈퇴)이다.
//
// 컨테이너(폭·radius·타이포)는 시안 실측값이다. 안쪽 여백이 20인 근거는, 시안 프레임이 298로
// 잡혀 있으나 그 안의 버튼 행이 300(x=-1)이라 프레임 쪽이 반올림 아티팩트이고
// `340 - 20×2 = 300`이 정확히 맞아떨어지기 때문이다.

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
  // 한 화면에 인스턴스가 여럿 뜬다(B-24의 로그아웃·회원탈퇴). ID를 고정하면 문서에 중복이
  // 생겨 aria-labelledby가 다른 다이얼로그의 문구를 가리킬 수 있다. useId는 SSR·CSR 값이
  // 일치하도록 React가 보장하므로 하이드레이션 경고도 나지 않는다.
  const id = useId();
  const titleId = `${id}-title`;
  const messageId = `${id}-message`;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      busy={isProcessing}
      role="alertdialog"
      // 제목이 있으면 제목이 이름, 없으면 메시지를 이름으로 삼아 모달에 항상 접근성 이름을 준다.
      aria-labelledby={title !== undefined ? titleId : messageId}
      aria-describedby={title !== undefined ? messageId : undefined}
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
    </Dialog>
  );
}
