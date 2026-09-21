'use client';

import { useState } from 'react';

import Link from 'next/link';

import { AlertDialog } from '@/components/ui/AlertDialog';
import { ERROR_ACTION_CLASS, ErrorScreen } from '@/components/ui/ErrorScreen';
import { useToast } from '@/components/ui/Toast';
import { ADDRESS_ACTION_TOAST, DELETE_ADDRESS_DIALOG } from '@/constants/addressActions';
import { ADDRESS_MAX } from '@/constants/businessRules';
import { ERROR_SCREEN_RETRY_LABEL } from '@/constants/commonMessages';
import { AddressCard } from '@/features/user/components/AddressCard';
import { AddressListSkeleton } from '@/features/user/components/AddressListSkeleton';
import {
  useAddresses,
  useDeleteAddress,
  useSetDefaultAddress,
} from '@/features/user/hooks/useAddresses';
import { ApiError } from '@/lib/api';
import type { Address } from '@/types/address';
import { ADDRESS_ERROR_CODE } from '@/types/api/address';

// B-30 배송지 목록 본문. 페이지(서버 컴포넌트)는 앱바만 조립하고 데이터는 여기서 가져온다.
//
// 조회가 클라이언트인 이유는 `useAddresses` 주석 참고(SID httpOnly 쿠키는 브라우저만 갖고 있다).
//
// ⚠️ 로딩·조회 실패 화면은 시안이 없다(FN-B30-01이 '디자인 필요'로 남겨 뒀다). 새로 그리지 않고
//    공용 `ErrorScreen`과 공용 `Skeleton`을 재사용한다. 시안이 나오면 교체한다.

// 시안의 + 아이콘(22px 박스 안 14px 글리프). lucide의 Plus는 획이 얇아 시안과 다르게 보여
// 경로를 그대로 옮겼다. 굵기·둥근 끝이 시안의 채워진 형태와 일치한다.
function PlusIcon() {
  return (
    <svg aria-hidden className="size-[22px] shrink-0" fill="currentColor" viewBox="0 0 22 22">
      <path d="M17.1328 10.1328C17.6118 10.1328 18 10.521 18 11C18 11.479 17.6118 11.8672 17.1328 11.8672H11.8672V17.1328C11.8672 17.6118 11.479 18 11 18C10.521 18 10.1328 17.6118 10.1328 17.1328V11.8672H4.86721C4.38824 11.8672 4.00003 11.479 4 11C4 10.521 4.38821 10.1328 4.86721 10.1328H10.1328V4.86721C10.1328 4.38821 10.521 4 11 4C11.479 4 11.8672 4.38821 11.8672 4.86721V10.1328H17.1328Z" />
    </svg>
  );
}

interface AddressListViewProps {
  /** 등록 화면 경로. 라우트는 호출부(page)가 정한다. */
  createHref: string;
}

export function AddressListView({ createHref }: AddressListViewProps) {
  const { addresses, isLoading, error, refetch } = useAddresses();
  const { showToast } = useToast();
  const setDefault = useSetDefaultAddress();
  const deleteMutation = useDeleteAddress();
  // 삭제 확인 다이얼로그 대상. null이면 닫힘(ParticipationList의 낙찰취소와 같은 방식).
  const [deleteTarget, setDeleteTarget] = useState<Address | null>(null);

  // 기본 지정은 확인 없이 바로 실행한다(파괴적이지 않음). 성공/실패는 토스트로 알린다.
  // 동시 변경 충돌(409 SHIP_004)만 재시도 문구로 구분하고, 그 외 실패는 일반 문구로 묶는다.
  function handleSetDefault(id: string) {
    setDefault.mutate(id, {
      onSuccess: () => showToast(ADDRESS_ACTION_TOAST.defaultSet),
      onError: (caught) => {
        const isConflict =
          caught instanceof ApiError && caught.code === ADDRESS_ERROR_CODE.defaultConflict;
        showToast(
          isConflict ? ADDRESS_ACTION_TOAST.defaultConflict : ADDRESS_ACTION_TOAST.defaultFailed,
        );
      },
    });
  }

  // 삭제 확정. 성공하면 다이얼로그를 닫고 토스트, 실패하면 다이얼로그를 열어 둔 채 토스트로 알려
  // 바로 재시도할 수 있게 한다(닉네임 변경 모달과 같은 방침).
  function handleConfirmDelete() {
    if (deleteTarget === null) {
      return;
    }
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        showToast(ADDRESS_ACTION_TOAST.deleted);
      },
      onError: () => showToast(ADDRESS_ACTION_TOAST.deleteFailed),
    });
  }

  if (error !== null) {
    return (
      <ErrorScreen description={['배송지를 불러오지 못했어요.', '잠시 후 다시 시도해주세요.']}>
        <button className={ERROR_ACTION_CLASS} onClick={refetch} type="button">
          {ERROR_SCREEN_RETRY_LABEL}
        </button>
      </ErrorScreen>
    );
  }

  // 첫 조회 중에는 문구가 들어가는 것을 그리지 않는다. 개수를 알기 전에 버튼을 그리면
  // '신규/새 배송지 추가' 문구와 상한 안내가 응답 후 바뀌어 깜빡인다. 그렇다고 아무것도 안 그리면
  // 응답이 늦을 때 빈 화면이라 고장으로 보여서, 문구 없이 자리만 잡는 스켈레톤을 둔다.
  if (isLoading || addresses === null) {
    return <AddressListSkeleton />;
  }

  const isEmpty = addresses.length === 0;
  const isFull = addresses.length >= ADDRESS_MAX;

  return (
    <div className="flex w-full flex-col gap-5 px-4 pt-5">
      {/* 시안이 상태별로 문구가 다르다. 빈 목록(453:25757)은 '신규 배송지 추가',
          카드가 있는 목록(453:25765)은 '새 배송지 추가'다. 같은 버튼이라 통일하고 싶지만
          문구는 디자인 결정이라 시안 그대로 둔다. 의도인지 확인 후 한쪽으로 정리한다.

          상한 도달 상태는 시안이 없다(FN-B30-01에 '디자인 필요'로 남아 있다). 링크를 죽이면
          눌러도 반응이 없어 고장으로 보이므로, 이동만 막고 문구로 이유를 알린다. 문구는
          같은 규칙을 쓰는 B-14의 '카드는 최대 5개까지 등록할 수 있어요'를 따랐다. */}
      {isFull ? (
        <p className="bg-surface-disabled-secondary text-label-14 text-content-disabled-secondary rounded-8 flex w-full items-center justify-center gap-1 py-3">
          배송지는 최대 {ADDRESS_MAX}개까지 등록할 수 있어요
        </p>
      ) : (
        <Link
          className="bg-surface-secondary text-label-14 text-content-tertiary rounded-8 active:bg-surface-button-quarternary-pressed flex w-full items-center justify-center gap-1 py-3"
          href={createHref}
        >
          <PlusIcon />
          {isEmpty ? '신규 배송지 추가' : '새 배송지 추가'}
        </Link>
      )}

      {!isEmpty && (
        <ul className="flex w-full flex-col gap-5">
          {addresses.map((address) => {
            // 이 카드에 대한 뮤테이션이 진행 중이면 액션을 잠근다(이중 요청·중복 클릭 방지).
            const isBusy =
              (setDefault.isPending && setDefault.variables === address.id) ||
              (deleteMutation.isPending && deleteTarget?.id === address.id);

            return (
              // `editHref`를 넘기지 않아 '수정'은 그려지기만 한다. 수정 저장이 배선되기 전에 링크를
              // 살리면, 폼을 채우고 확인을 눌러도 저장 없이 목록으로 돌아가 저장된 것처럼 보인다
              // (조회 응답에 원본 전화번호가 없어 아직 못 붙인다). 기본 지정·삭제는 #129에서 배선했다.
              <AddressCard
                address={address}
                isBusy={isBusy}
                key={address.id}
                onDelete={() => setDeleteTarget(address)}
                onSetDefault={() => handleSetDefault(address.id)}
              />
            );
          })}
        </ul>
      )}

      <AlertDialog
        cancelLabel={DELETE_ADDRESS_DIALOG.cancelLabel}
        confirmLabel={DELETE_ADDRESS_DIALOG.confirmLabel}
        isOpen={deleteTarget !== null}
        isProcessing={deleteMutation.isPending}
        message={DELETE_ADDRESS_DIALOG.message}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={DELETE_ADDRESS_DIALOG.title}
      />
    </div>
  );
}
