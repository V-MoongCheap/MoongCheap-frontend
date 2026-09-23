'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';

import { Checkbox } from '@/components/ui/Checkbox';
import { useToast } from '@/components/ui/Toast';
import {
  ADDRESS_INPUT_CLASS,
  ADDRESS_READONLY_CLASS,
  AddressField,
} from '@/features/user/components/AddressField';
import { toFullAddress, useDaumPostcode } from '@/hooks/useDaumPostcode';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';
import {
  ADDRESS_DETAIL_MAX_LENGTH,
  ADDRESS_NAME_MAX_LENGTH,
  ENTRANCE_CODE_MAX_LENGTH,
  PHONE_MAX_LENGTH,
  RECIPIENT_MAX_LENGTH,
  addressSchema,
  type AddressFormValues,
} from '@/schemas/address';

// B-30 배송지 등록·수정 폼. `FN-B30-02`.
//
// 시안에 오류 문구가 없고 확인 버튼만 비활성/활성 두 상태로 그려져 있다. 그래서 검증 결과를
// 글로 노출하지 않고 **버튼 잠금**으로만 쓴다(schemas/address.ts 주석 참고).
//
// 저장은 `onSave`로 받는다. 폼은 어떤 엔드포인트를 부르는지 모른다(등록·수정이 다른 API다).
// `onSave`가 없으면 이동만 한다.

const EMPTY_VALUES: AddressFormValues = {
  postalCode: '',
  address: '',
  addressDetail: '',
  entranceCode: '',
  noEntranceCode: false,
  name: '',
  recipient: '',
  phone: '',
  isDefault: false,
};

interface AddressFormProps {
  /**
   * 저장을 마친 뒤 이동할 경로. 배송지 입력은 마이페이지 외에 주문 플로우에서도 쓰이므로
   * 폼이 목적지를 직접 들고 있으면 안 된다(`features`는 라우트 문자열을 갖지 않는다).
   */
  successHref: string;
  /** 수정 화면에서 기존 값을 채워 넣는다. 없으면 등록. */
  defaultValues?: AddressFormValues;
  /**
   * '기본 배송지로 설정'을 체크한 채 잠근다. 두 경우에 해제할 수 없다.
   * - 최초 등록(목록 0건): 첫 배송지는 무조건 기본이 된다(구성 요소 `BR-04`)
   * - 현재 기본배송지 수정: 해제하면 기본배송지가 0건이 된다(`BR-B30-02-06`)
   */
  lockDefault?: boolean;
  /**
   * 저장 동작. 넘기지 않으면 저장 없이 `successHref`로 이동만 한다.
   *
   * 함수 prop이라 넘기는 쪽도 client여야 한다. 서버 컴포넌트인 페이지가 직접 넘길 수 없어
   * `AddressCreateView`·`AddressEditView`가 중간에서 받는다.
   */
  onSave?: (values: AddressFormValues) => Promise<void>;
}

export function AddressForm({
  successHref,
  defaultValues = EMPTY_VALUES,
  lockDefault = false,
  onSave,
}: AddressFormProps) {
  const router = useRouter();
  const { open } = useDaumPostcode();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, setValue, control, formState } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    // 잠긴 경우 값도 체크된 상태로 시작해야 한다. 체크박스를 disabled로만 두면 표시는 꺼진 채
    // 잠겨 버린다.
    defaultValues: lockDefault ? { ...defaultValues, isDefault: true } : defaultValues,
    // 시안의 버튼이 입력 도중에 활성으로 바뀌므로 매 변경마다 판정한다.
    mode: 'onChange',
  });

  // useWatch는 watch()와 달리 메모이제이션 안전(React Compiler 호환)이라 이걸 쓴다.
  const noEntranceCode = useWatch({ control, name: 'noEntranceCode' });
  const address = useWatch({ control, name: 'address' });

  async function handleFindPostalCode() {
    await open((data) => {
      // 검색으로만 채워지는 값이라 dirty·validation을 함께 갱신해야 버튼이 열린다.
      setValue('postalCode', data.zonecode, { shouldValidate: true, shouldDirty: true });
      setValue('address', toFullAddress(data), { shouldValidate: true, shouldDirty: true });
    });
  }

  function handleNoEntranceCodeChange(checked: boolean) {
    setValue('noEntranceCode', checked, { shouldValidate: true, shouldDirty: true });
    if (checked) {
      // 체크하면 입력칸을 비운다. 값이 남아 있으면 잠긴 칸의 내용이 그대로 저장된다.
      setValue('entranceCode', '', { shouldValidate: true, shouldDirty: true });
    }
  }

  async function onSubmit(values: AddressFormValues) {
    if (onSave === undefined) {
      // 저장이 배선되지 않은 화면은 이동만 한다.
      router.push(successHref);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(values);
      router.push(successHref);
      // 목록은 client에서 조회하므로 push만으로는 낡은 데이터가 남는다. 서버 캐시도 함께 버린다.
      router.refresh();
    } catch (error) {
      // 시안에 오류 문구 자리가 없다(검증은 버튼 잠금으로만 표시). 서버가 거절한 사유는
      // 알려야 하므로 공용 토스트로 띄운다. 백엔드가 사용자용 한국어 문구를 주므로 그대로 쓴다.
      showToast(error instanceof ApiError ? error.message : '배송지를 저장하지 못했습니다.');
      setIsSaving(false);
    }
  }

  // 저장 중에는 잠근다. 연타하면 같은 배송지가 두 건 등록된다.
  const canSubmit = formState.isValid && formState.isDirty && !isSaving;

  return (
    <form className="flex w-full flex-1 flex-col" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex w-full flex-1 flex-col gap-5 px-4 py-2">
        <AddressField label="주소">
          <div className="flex w-full flex-col gap-2">
            <div className="flex items-center gap-2">
              {/* 검색 결과만 채우는 칸이라 readOnly. disabled로 두면 제출값에서 빠진다. */}
              <input
                aria-label="우편번호"
                className={cn(ADDRESS_READONLY_CLASS, 'w-22.5')}
                readOnly
                {...register('postalCode')}
              />
              {/* 시안은 86x40(w-21.5) 안에 '우편번호 찾기'가 한 줄로 꽉 찬다. Figma가 붙여 둔
                  좌우 여백 12px은 컴포넌트 기본값이고 텍스트가 그걸 밀고 나간 상태라, 그대로
                  옮기면 글자 자리가 62px밖에 안 남아 두 줄로 깨진다. */}
              <button
                className="bg-surface-button-tertiary-default text-content-inverse text-label-13 rounded-8 active:bg-surface-button-tertiary-pressed focus-visible:ring-effect-focus-ring-primary flex h-10 w-21.5 shrink-0 items-center justify-center px-1 whitespace-nowrap outline-none focus-visible:ring-2"
                onClick={handleFindPostalCode}
                type="button"
              >
                우편번호 찾기
              </button>
            </div>

            <input
              aria-label="주소"
              className={cn(ADDRESS_READONLY_CLASS, 'w-full')}
              readOnly
              {...register('address')}
            />
            <input
              aria-label="상세주소"
              className={cn(ADDRESS_READONLY_CLASS, 'w-full')}
              // 시안대로 주소를 고르기 전에는 상세주소를 막는다(FN-B30-02 BR-02).
              // 시안에 플레이스홀더가 없어 넣지 않았다. 어느 칸인지는 aria-label로만 구분된다.
              disabled={address === ''}
              maxLength={ADDRESS_DETAIL_MAX_LENGTH}
              {...register('addressDetail')}
            />
          </div>
        </AddressField>

        <div className="flex w-full flex-col gap-5">
          <AddressField label="공동현관 출입번호">
            <div className="flex w-full flex-col gap-3">
              <input
                className={cn(ADDRESS_INPUT_CLASS, noEntranceCode && 'bg-surface-disabled-primary')}
                disabled={noEntranceCode}
                aria-label="공동현관 출입번호"
                maxLength={ENTRANCE_CODE_MAX_LENGTH}
                placeholder="공동현관번호를 입력해주세요. (예 : #1234)"
                {...register('entranceCode')}
              />
              <Checkbox
                checked={noEntranceCode}
                label="공동현관번호 없음"
                onChange={(event) => handleNoEntranceCodeChange(event.target.checked)}
              />
            </div>
          </AddressField>

          <AddressField label="배송지명">
            <input
              className={ADDRESS_INPUT_CLASS}
              aria-label="배송지명"
              maxLength={ADDRESS_NAME_MAX_LENGTH}
              placeholder="배송지명을 입력해주세요. (예 : 집, 회사)"
              {...register('name')}
            />
          </AddressField>

          <AddressField label="받는 분">
            <input
              className={ADDRESS_INPUT_CLASS}
              aria-label="받는 분"
              maxLength={RECIPIENT_MAX_LENGTH}
              placeholder="받는 분을 입력해주세요."
              {...register('recipient')}
            />
          </AddressField>

          <AddressField label="휴대폰 번호">
            {/* 입력칸은 하이픈 없이 받는다(시안 453:25833의 입력값이 `01012341234`, 플레이스홀더도
                '-없이'). 하이픈은 목록 카드에서만 붙인다(formatPhone).
                기능명세 FN-B30-02는 "하이픈 자동 삽입 표시"라고 적고 있어 시안과 어긋난다.
                시안 두 곳(입력값·플레이스홀더)이 서로 일관되므로 시안을 따르고 PM에 확인 요청했다. */}
            <input
              className={ADDRESS_INPUT_CLASS}
              inputMode="numeric"
              aria-label="휴대폰 번호"
              maxLength={PHONE_MAX_LENGTH}
              placeholder="-없이 휴대폰 번호를 입력해주세요."
              {...register('phone')}
            />
          </AddressField>
        </div>

        {/* 최초 등록과 현재 기본배송지 수정에서는 해제할 수 없다(BR-04 · BR-B30-02-06). */}
        <Checkbox disabled={lockDefault} label="기본 배송지로 설정" {...register('isDefault')} />
      </div>

      <div className="w-full p-4">
        {/* 명세는 수정 모드 CTA를 "변경 발생 시 활성"으로 정한다. 등록 모드는 빈 폼에서 시작해
            값을 채우는 순간 dirty가 되므로, 두 모드에 같은 조건을 써도 동작이 갈리지 않는다. */}
        <button
          className={cn(
            'text-button-15 rounded-8 focus-visible:ring-effect-focus-ring-primary flex h-12 w-full items-center justify-center px-3 outline-none focus-visible:ring-2',
            canSubmit
              ? 'bg-surface-button-tertiary-default text-content-inverse active:bg-surface-button-tertiary-pressed'
              : 'bg-surface-disabled-secondary text-content-disabled-secondary',
          )}
          disabled={!canSubmit}
          type="submit"
        >
          확인
        </button>
      </div>
    </form>
  );
}
