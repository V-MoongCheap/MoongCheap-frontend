'use client';

import { useQueryClient } from '@tanstack/react-query';

import { AddressForm } from '@/features/user/components/AddressForm';
import { ADDRESS_QUERY_KEYS, useAddresses } from '@/features/user/hooks/useAddresses';
import { createAddress } from '@/lib/addressApi';
import type { AddressFormValues } from '@/schemas/address';

// B-30 배송지 등록 본문.
//
// 페이지가 아니라 여기서 목록을 조회하는 이유가 둘이다.
//  1) 세션이 SID httpOnly 쿠키라 서버 컴포넌트에서 부르면 401이다(`useAddresses` 주석).
//  2) `onSave`가 함수 prop이라 넘기는 쪽도 client여야 한다.
//
// 목록이 필요한 것은 개수 하나 때문이다. 첫 배송지는 무조건 기본이 되므로
// '기본 배송지로 설정'을 체크한 채 잠가야 한다(구성 요소 `BR-04`).

interface AddressCreateViewProps {
  /** 저장 후 이동할 경로. 주문 플로우에서도 쓰이므로 페이지가 정한다. */
  successHref: string;
}

export function AddressCreateView({ successHref }: AddressCreateViewProps) {
  const { addresses, isLoading, error } = useAddresses();
  const queryClient = useQueryClient();

  // 개수를 모르는 채 폼을 그리면 잠금 상태가 응답 후 바뀐다. 사용자가 그 사이에 체크를
  // 건드리면 값이 튄다. 조회가 끝난 뒤에 한 번만 그린다.
  //
  // 조회에 실패해도 등록 자체는 가능해야 한다. 개수를 모르면 잠그지 않고(0건 아님으로 간주),
  // 상한을 넘겼다면 서버가 SHIP_002로 거절하고 폼이 그 문구를 토스트로 띄운다.
  if (isLoading) {
    return null;
  }

  const lockDefault = error === null && addresses !== null && addresses.length === 0;

  // 등록 후 목록 캐시를 버린다. 이것이 없으면 방금 등록한 배송지가 목록에 바로 보이지 않는다.
  //
  // 목록은 이 훅의 Query 캐시에서 나오므로 신선도 시간(전역 60초) 안에는 옛 목록이 그대로
  // 그려진다. 폼은 저장 뒤 들어온 화면으로 돌아가기만 하므로(`AddressForm`), 무효화를 기다린 뒤에
  // 폼이 이동하도록 await로 둔다.
  async function handleSave(values: AddressFormValues) {
    await createAddress(values);
    await queryClient.invalidateQueries({ queryKey: ADDRESS_QUERY_KEYS.list });
  }

  return <AddressForm lockDefault={lockDefault} onSave={handleSave} successHref={successHref} />;
}
