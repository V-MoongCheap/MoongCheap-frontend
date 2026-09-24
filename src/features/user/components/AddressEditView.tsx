'use client';

import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';

import { AppBar } from '@/components/layout/AppBar';
import { ERROR_ACTION_CLASS, ErrorScreen } from '@/components/ui/ErrorScreen';
import { ERROR_SCREEN_RETRY_LABEL } from '@/constants/commonMessages';
import { AddressForm } from '@/features/user/components/AddressForm';
import { ADDRESS_QUERY_KEYS, useAddress } from '@/features/user/hooks/useAddresses';
import { setDefaultAddress, updateAddress } from '@/lib/addressApi';
import type { AddressFormValues } from '@/schemas/address';
import type { AddressDetail } from '@/types/address';
import { ADDRESS_ERROR_CODE } from '@/types/api/address';

// B-30 배송지 수정 본문. `FN-B30-02`.
//
// 등록(`AddressCreateView`)과 같은 이유로 client다 — SID httpOnly 쿠키라 서버 컴포넌트에서 조회할
// 수 없고, `onSave`는 함수 prop이다.
//
// 단건 조회를 쓰는 이유는 전화번호다. 목록 응답은 마스킹돼 있어 폼에 채워 다시 보낼 수 없고,
// 단건 응답만 원본을 준다(`lib/addressApi.ts` 주석).
//
// ⚠️ 로딩·오류 화면은 시안이 없다. 목록 화면처럼 공용 `ErrorScreen`을 재사용한다.

interface AddressEditViewProps {
  addressId: string;
  /** 앱바 제목. 폼이 없는 조회 중·오류 상태에도 같은 앱바를 보인다. */
  title: string;
  /** 저장 후 이동할 경로. 조회 실패 시 돌아갈 곳도 여기다. */
  successHref: string;
}

/**
 * 저장된 값을 폼 초기값으로 옮긴다. 받는 분·휴대폰이 프론트 규칙에 안 맞아도 그대로 채운다 —
 * 폼이 `savedContact`로 저장값을 인정한다(`schemas/address.ts`의 `SavedContact` 주석).
 */
function toFormValues(address: AddressDetail): AddressFormValues {
  return {
    postalCode: address.postalCode,
    address: address.address,
    addressDetail: address.addressDetail,
    entranceCode: address.entranceCode ?? '',
    // 저장된 값이 없다는 것은 '없음'을 골랐다는 뜻이다(스키마상 둘 중 하나는 채워진다).
    noEntranceCode: address.entranceCode === undefined,
    name: address.name,
    recipient: address.recipient,
    phone: address.phoneRaw,
    isDefault: address.isDefault,
  };
}

export function AddressEditView({ addressId, title, successHref }: AddressEditViewProps) {
  const { address, isLoading, error, refetch } = useAddress(addressId);
  const queryClient = useQueryClient();

  // 값을 받기 전에 폼을 그리면 빈 폼이 초기값으로 굳는다(useForm은 defaultValues를 마운트 때만
  // 읽는다). 받은 뒤에 한 번만 그린다.
  if (address === null) {
    // 폼이 없는 상태의 앱바. 입력이 없으니 이탈 확인 없이 기본 뒤로 가기를 쓴다.
    const appBar = <AppBar backHref={successHref} title={title} />;

    if (isLoading || error === null) {
      return appBar;
    }

    // 없는 배송지(이미 삭제)·남의 배송지는 다시 불러도 같다. 재시도 대신 목록으로 돌려보낸다.
    const isGone =
      error.code === ADDRESS_ERROR_CODE.notFound || error.code === ADDRESS_ERROR_CODE.forbidden;

    return (
      <>
        {appBar}
        {isGone ? (
          <ErrorScreen description={['배송지를 찾을 수 없어요.', '목록에서 다시 선택해주세요.']}>
            <Link className={ERROR_ACTION_CLASS} href={successHref}>
              목록으로
            </Link>
          </ErrorScreen>
        ) : (
          <ErrorScreen description={['배송지를 불러오지 못했어요.', '잠시 후 다시 시도해주세요.']}>
            <button className={ERROR_ACTION_CLASS} onClick={refetch} type="button">
              {ERROR_SCREEN_RETRY_LABEL}
            </button>
          </ErrorScreen>
        )}
      </>
    );
  }

  // 조기 반환 뒤라 null이 아니다. 중첩 함수에서는 좁혀진 타입이 이어지지 않아 상수로 붙잡는다.
  const current = address;

  // 수정 API는 기본 지정을 받지 않는다(별도 엔드포인트). 폼의 '기본 배송지로 설정'을 새로 체크했을
  // 때만 이어서 지정한다. 현재 기본이면 체크박스가 잠겨 있어 해제 경로는 없다(BR-B30-02-06).
  //
  // 목록 캐시는 성공·실패와 무관하게 버린다. 수정은 됐는데 기본 지정만 실패(409 SHIP_004 등)해도
  // 목록은 이미 바뀌었다. 실패하면 폼이 토스트를 띄우고 남아 있으므로 다시 누르면 된다(PATCH는
  // 같은 값을 또 보내도 결과가 같다). 단건 캐시는 이 화면을 떠나면 지워지므로(`useAddress`) 다시
  // 받지 않는다 — 여기서 재조회하면 이동 직전에 버릴 요청을 기다리게 된다.
  async function handleSave(values: AddressFormValues) {
    try {
      await updateAddress(current, values);
      if (values.isDefault && !current.isDefault) {
        await setDefaultAddress(current.id);
      }
    } finally {
      await queryClient.invalidateQueries({ queryKey: ADDRESS_QUERY_KEYS.list });
    }
  }

  return (
    // 현재 기본배송지는 해제하면 기본이 0건이 된다. 다른 배송지를 기본으로 지정하는 방식으로만
    // 바꿀 수 있다(BR-B30-02-06).
    <AddressForm
      defaultValues={toFormValues(current)}
      lockDefault={current.isDefault}
      onSave={handleSave}
      savedContact={{ recipient: current.recipient, phone: current.phoneRaw }}
      successHref={successHref}
      title={title}
    />
  );
}
