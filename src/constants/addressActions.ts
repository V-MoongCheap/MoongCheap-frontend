/**
 * 배송지 기본 지정·삭제(B-30, #129) 확인 다이얼로그·토스트 문구. **잠정**(시안 텍스트 부재 —
 * FN-B30-05·FN-B30-06이 'Full 범위'로 남아 확인 모달·기본 지정 UI 시안이 없다. 최종 카피가 나오면
 * 여기만 손본다).
 *
 * 문구를 컴포넌트에서 분리한 이유는 낙찰 취소(`awardCancel.ts`)와 같다 — 파괴적 확인 흐름의 카피는
 * 디자인 결정이라 한곳에 모아 두고 UI 로직과 섞지 않는다.
 */

/**
 * 삭제 확인 다이얼로그(공용 AlertDialog).
 *
 * `messageFor`는 어떤 배송지를 지우는지 이름으로 못박아 오삭제를 막는다(목록에 여러 개일 때 필요).
 * 대상이 없을 때(다이얼로그 닫힘)를 위한 정적 `message`도 둔다.
 */
export const DELETE_ADDRESS_DIALOG = {
  title: '배송지를 삭제하시겠어요?',
  message: '삭제한 배송지는 다시 되돌릴 수 없어요.',
  messageFor: (name: string) => `'${name}' 배송지를 삭제하면 다시 되돌릴 수 없어요.`,
  confirmLabel: '삭제',
  cancelLabel: '돌아가기',
} as const;

/** 기본 지정·삭제 결과 토스트. */
export const ADDRESS_ACTION_TOAST = {
  defaultSet: '기본 배송지로 설정했어요',
  /** 기본 지정 동시 변경 충돌(409 SHIP_004) — 재시도 안내. */
  defaultConflict: '기본 배송지가 방금 변경됐어요. 다시 시도해주세요.',
  defaultFailed: '기본 배송지 설정에 실패했어요. 잠시 후 다시 시도해주세요.',
  deleted: '배송지를 삭제했어요',
  /** 이미 삭제된 배송지를 다시 지우려 한 경우(404 SHIP_001). 재조회로 목록을 맞춘다. */
  deleteAlreadyGone: '이미 삭제된 배송지예요',
  deleteFailed: '배송지 삭제에 실패했어요. 잠시 후 다시 시도해주세요.',
} as const;
