'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';

import { Skeleton } from '@/components/ui/Skeleton';
import { DEMAND_FORM_MESSAGES, DEMAND_FORM_SECTIONS } from '@/constants/demandFormMessages';
import { DemandFormSection } from '@/features/demand/components/DemandFormSection';
import { AddressCard } from '@/features/user/components/AddressCard';
import { useAddresses } from '@/features/user/hooks/useAddresses';

// B-09 배송지 등록 섹션. 시안 `1153:71247`(없음) · `1153:71361`(기본 배송지 있음).
//
// 카드 생김새가 배송지 목록(B-30)과 같아서 `AddressCard`를 그대로 쓴다. 실제로 두 시안의
// 테두리 · radius · 배지 · 수정|삭제 줄이 전부 일치한다.
//
// 배송지가 있을 때는 **기본 배송지 한 건만** 보여 준다. 시안에 배송지를 고르는 UI가 없고,
// `신규 배송지 추가` 행도 함께 사라진다. 그래서 이 섹션은 값을 위로 올리지 않는다. 고르는
// 동작이 생기면 그때 `DemandFormValues.addressId`에 연결한다.
//
// ⚠️ 기본 배송지가 있으면 시안에서 추가 경로가 사라진다. 배송지는 최대 5개인데(`ADDRESS_MAX`)
//    여기서 더 담을 방법이 없어진다. 디자인 확인 대상이라 시안 그대로 두었다.
//
// 조회 실패는 화면을 막지 않는다. 로그인 전 · 백엔드 미기동에서도 401이 나므로, 없는 것과 같이
// 보고 `신규 배송지 추가` 행을 띄운다.

/** 시안: 카드 안쪽 회색 행. 329x46 · radius 8 · surface-secondary. */
const ADD_ROW_CLASS =
  'bg-surface-secondary rounded-8 text-label-14 text-content-tertiary flex h-11.5 w-full items-center justify-center gap-1';

export function AddressSection() {
  const { addresses, isLoading } = useAddresses();

  // 기본 배송지가 있으면 그것을, 없으면 첫 건을 보여 준다. 시안은 `기본배송지` 배지가 붙은
  // 카드 한 장만 그린다.
  const shown = addresses?.find((address) => address.isDefault) ?? addresses?.[0];

  return (
    <DemandFormSection
      title={DEMAND_FORM_SECTIONS.address.title}
      titleId={DEMAND_FORM_SECTIONS.address.id}
    >
      {isLoading ? (
        // 시안에 로딩 상태가 없다. 카드가 들어올 자리만 잡아 둔다(#77 리뷰에서 받은 지적과 같은 방침).
        <Skeleton className="rounded-8 h-11.5 w-full" />
      ) : shown === undefined ? (
        <Link className={ADD_ROW_CLASS} href="/mypage/addresses/new">
          <Plus className="size-3.5" strokeWidth={2.5} />
          {DEMAND_FORM_MESSAGES.addAddress}
        </Link>
      ) : (
        <ul className="flex w-full flex-col">
          <AddressCard address={shown} editHref={`/mypage/addresses/${shown.id}/edit`} />
        </ul>
      )}
    </DemandFormSection>
  );
}
