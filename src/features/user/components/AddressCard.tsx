'use client';

import { useEffect, useRef } from 'react';

import Link from 'next/link';

import { formatPhone } from '@/lib/formatPhone';
import type { Address } from '@/types/address';

// 배송지 목록(B-30)의 카드 한 장. 배송지명 + 기본배송지 뱃지 + 주소 + 연락처 + 기본 지정·수정·삭제.
//
// 액션은 전부 선택 prop이다. 목록(B-30)은 세 액션을 배선하고, 수요 등록 폼의 배송지 섹션(B-09)은
// `editHref`만 넘겨 '수정'만 살린다. 핸들러를 안 넘긴 액션은 이동/동작 없이 텍스트로만 남는다.
//
// '기본 지정'은 기본 배송지가 아닌 카드에서 `onSetDefault`가 있을 때만 뜬다(기본 카드는 뱃지가
// 그 역할을 하므로 숨긴다). 삭제는 파괴적 동작이라 확인 모달을 거치는데, 모달·뮤테이션은 목록
// 컨테이너(`AddressListView`)가 들고 이 카드는 `onDelete`로 트리거만 한다.

interface AddressCardProps {
  address: Address;
  /** 수정 화면 경로. 넘기지 않으면 '수정'도 이동하지 않는다. */
  editHref?: string;
  /** 기본 배송지로 지정. 넘기지 않거나 이미 기본인 카드면 '기본 지정'을 그리지 않는다. */
  onSetDefault?: () => void;
  /** 삭제 확인 요청. 넘기지 않으면 '삭제'는 동작 없이 그려지기만 한다. */
  onDelete?: () => void;
  /** 이 카드에 대한 뮤테이션 진행 중. 액션 버튼을 잠가 이중 요청을 막는다. */
  isBusy?: boolean;
  /**
   * 기본 지정 성공 직후 이 카드로 포커스를 옮길지. 지정에 성공하면 '기본 지정' 버튼이 사라져
   * 키보드 포커스가 body로 떨어지는데, 그때 이 카드로 포커스를 되돌린다. 실제 이동은 이 카드가
   * 기본(`isDefault`)이 된 뒤에만 하고, 이동 후 `onDefaultFocused`로 부모에게 한 번만 알린다.
   */
  shouldFocusOnDefault?: boolean;
  /** 포커스 이관을 마쳤음을 부모에 알린다(부모가 요청 플래그를 내린다). */
  onDefaultFocused?: () => void;
}

// 폭은 글자 + 좌우 여백으로 잡는다. 시안의 54px은 두 글자('수정'·'삭제', ≈21px)에 양옆 ≈16px이
// 붙은 값이라, 고정 폭으로 두면 '기본 지정'(≈44px)은 여백이 5px로 줄어 카드 가장자리에 붙는다.
// 최소 폭 54px은 두 글자 액션을 시안 그대로 두기 위한 것이다.
const ACTION_CLASS =
  'text-label-12 text-content-quarternary flex min-w-[54px] items-center justify-center px-4 py-2 disabled:opacity-40';

export function AddressCard({
  address,
  editHref,
  onSetDefault,
  onDelete,
  isBusy,
  shouldFocusOnDefault,
  onDefaultFocused,
}: AddressCardProps) {
  const { name, isDefault, postalCode, address: street, addressDetail } = address;
  const { entranceCode, recipient, phone } = address;
  const cardRef = useRef<HTMLLIElement>(null);

  // 기본 지정 성공(→ 재조회로 isDefault=true) 후, 사라진 버튼 대신 이 카드로 포커스를 옮긴다.
  // 마우스 클릭 뒤엔 :focus-visible이 링을 숨겨 시안을 해치지 않고, 키보드일 때만 링이 보인다.
  useEffect(() => {
    if (shouldFocusOnDefault === true && isDefault) {
      cardRef.current?.focus();
      onDefaultFocused?.();
    }
  }, [shouldFocusOnDefault, isDefault, onDefaultFocused]);

  return (
    <li
      className="border-border-quarternary rounded-12 focus-visible:ring-effect-focus-ring-primary flex w-full flex-col border px-4 outline-none focus-visible:ring-2"
      ref={cardRef}
      tabIndex={-1}
    >
      <div className="border-border-quarternary flex w-full flex-col gap-3 border-b py-3">
        <div className="flex items-center gap-3">
          <p className="text-label-16 text-content-primary">{name}</p>
          {isDefault && (
            <span className="bg-surface-button-secondary-default text-content-brand text-caption-10 rounded-4 flex items-center justify-center px-0.5 pb-px">
              기본배송지
            </span>
          )}
        </div>

        <div className="flex w-full flex-col gap-1">
          <p className="text-body-14 text-content-primary w-full">
            {street}, {addressDetail} ({postalCode})
          </p>
          <p className="text-caption-12 text-content-quarternary w-full">
            공동현관번호: {entranceCode ?? '미입력'}
          </p>
          <p className="text-caption-12 text-content-quarternary w-full">
            {recipient} ({formatPhone(phone)})
          </p>
        </div>
      </div>

      {/* 액션 행. 뜨는 항목 사이에만 세로 구분선을 넣는다(마지막 항목 오른쪽엔 없음). */}
      <div className="flex items-center py-0.5">
        {onSetDefault !== undefined && !isDefault && (
          <div className="border-divider-default border-r">
            <button className={ACTION_CLASS} disabled={isBusy} onClick={onSetDefault} type="button">
              기본 지정
            </button>
          </div>
        )}

        <div className="border-divider-default border-r">
          {editHref === undefined ? (
            <span className={ACTION_CLASS}>수정</span>
          ) : (
            <Link className={ACTION_CLASS} href={editHref}>
              수정
            </Link>
          )}
        </div>

        {onDelete === undefined ? (
          <span className={ACTION_CLASS}>삭제</span>
        ) : (
          <button className={ACTION_CLASS} disabled={isBusy} onClick={onDelete} type="button">
            삭제
          </button>
        )}
      </div>
    </li>
  );
}
