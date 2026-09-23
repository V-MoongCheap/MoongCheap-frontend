import type { AddressFormValues } from '@/schemas/address';
import type { Address } from '@/types/address';
import type {
  ShippingAddressEditRequestDto,
  ShippingAddressRequestDto,
  ShippingAddressResponseDto,
} from '@/types/api/address';

import { apiFetch, parseCreatedId } from './api';

/**
 * 배송지(B-30) 백엔드 호출.
 *
 * `lib/authApi.ts`와 같은 규칙이다. 화면은 백엔드 DTO를 모르고 `types/address.ts`의 `Address`와
 * `schemas/address.ts`의 `AddressFormValues`만 안다. 변환은 전부 이 파일이 맡는다.
 *
 * 인증은 SID httpOnly 쿠키다. `apiFetch`가 `credentials: 'include'`를 붙인다.
 *
 * 실패는 `ApiError`로 올라온다. 배송지 고유 코드는 `types/api/address.ts`의 `ADDRESS_ERROR_CODE`에
 * 모아 뒀다(`SHIP_002` 상한 5개 등). 화면이 `error.code`로 분기한다.
 */

/** 선택 필드는 null·빈 문자열이 올 수 있다. 화면은 '없음'을 undefined 하나로 본다. */
function emptyToUndefined(value: string | null): string | undefined {
  return value === null || value === '' ? undefined : value;
}

/**
 * 응답 DTO를 화면용 타입으로 옮긴다.
 *
 * ⚠️ `phone`은 조회 경로에 따라 모양이 다르다(필드명은 둘 다 `phoneNumberMasked`).
 * - 목록: 마스킹된 문자열(`010-****-5678`). `formatPhone`이 형식 불일치 시 원본을 그대로 돌려주므로
 *   카드에 마스킹 값이 그대로 보인다(의도한 표시다).
 * - 단건: 하이픈 없는 원본(`01012345678`). 수정 폼에 채워 그대로 다시 보낼 수 있다.
 */
function toAddress(dto: ShippingAddressResponseDto): Address {
  return {
    // 화면·라우트 파라미터가 문자열이라 여기서 한 번만 맞춘다.
    id: String(dto.id),
    name: dto.alias,
    isDefault: dto.isDefault,
    postalCode: dto.zipcode,
    address: dto.address,
    // 폼 스키마가 문자열만 받는다. null이면 수정 화면의 확인 버튼이 영영 잠긴다.
    addressDetail: dto.addressDetail ?? '',
    // 카드가 `미입력`을 보여주는 기준이 undefined다. 빈 문자열·null은 없는 것으로 본다.
    entranceCode: emptyToUndefined(dto.entranceCode),
    recipient: dto.recipientName,
    phone: dto.phoneNumberMasked,
    requestMessage: emptyToUndefined(dto.requestMessage),
  };
}

/**
 * 폼 값을 수정 바디로 옮긴다. 등록 바디는 여기에 `setAsDefault`만 더한 모양이다.
 *
 * `noEntranceCode`는 입력을 잠그는 UI 상태라 보내지 않는다. 체크되면 폼이 `entranceCode`를
 * 비우므로 값만 봐도 된다.
 *
 * `requestMessage`(배송 요청사항)는 백엔드에 있으나 시안과 폼에 없다. 등록은 생략하고, 수정은
 * 기존 값을 그대로 실어 보낸다 — `PATCH`가 **전체 교체**라 빠뜨리면 백엔드가 null로 덮어쓴다.
 * 디자인 확인 후 폼이 생기면 폼 값으로 바꾼다.
 */
function toEditRequestDto(
  values: AddressFormValues,
  requestMessage?: string,
): ShippingAddressEditRequestDto {
  return {
    alias: values.name,
    recipientName: values.recipient,
    // 폼은 하이픈 없이 받는다. 백엔드 정규식이 하이픈 유무를 모두 허용해 그대로 보낸다.
    phoneNumber: values.phone,
    zipcode: values.postalCode,
    address: values.address,
    addressDetail: values.addressDetail,
    entranceCode: values.entranceCode,
    requestMessage,
  };
}

/** 등록 바디는 수정 바디에 `setAsDefault`만 더한 모양이다. */
function toCreateRequestDto(values: AddressFormValues): ShippingAddressRequestDto {
  return { ...toEditRequestDto(values), setAsDefault: values.isDefault };
}

/**
 * 배송지 목록. 백엔드가 **기본 배송지 우선, 최근 등록순**으로 정렬해 준다(`BR-B30-01`).
 * 프론트에서 다시 정렬하지 않는다. 전화번호는 마스킹돼 온다.
 *
 * `GET /api/shipping-addresses`
 */
export async function getAddresses(): Promise<Address[]> {
  const response = await apiFetch('/api/shipping-addresses');
  const data = (await response.json()) as ShippingAddressResponseDto[];
  return data.map(toAddress);
}

/**
 * 배송지 단건. 본인 소유가 아니면 403(`SHIP_003`), 없으면 404(`SHIP_001`)다.
 * 목록과 달리 전화번호를 마스킹하지 않는다(수정 폼 프리필용).
 *
 * `GET /api/shipping-addresses/{id}`
 */
export async function getAddress(id: string): Promise<Address> {
  const response = await apiFetch(`/api/shipping-addresses/${encodeURIComponent(id)}`);
  const data = (await response.json()) as ShippingAddressResponseDto;
  return toAddress(data);
}

/**
 * 배송지 등록. 첫 배송지는 `setAsDefault`와 무관하게 백엔드가 기본으로 지정한다.
 * 상한(5개)을 넘으면 400 `SHIP_002`.
 *
 * `POST /api/shipping-addresses` → 생성된 id
 */
export async function createAddress(values: AddressFormValues): Promise<string> {
  const response = await apiFetch('/api/shipping-addresses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toCreateRequestDto(values)),
  });
  return parseCreatedId(response);
}

/**
 * 배송지 수정(전체 교체). 기본 지정은 이 요청으로 바꿀 수 없고 `setDefaultAddress`를 쓴다.
 * 응답은 204에 본문이 없다.
 *
 * `current`(단건 조회 결과)를 받는 이유는 폼에 없는 필드를 보존하기 위해서다(`toEditRequestDto`).
 *
 * `PATCH /api/shipping-addresses/{id}`
 */
export async function updateAddress(current: Address, values: AddressFormValues): Promise<void> {
  await apiFetch(`/api/shipping-addresses/${encodeURIComponent(current.id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toEditRequestDto(values, current.requestMessage)),
  });
}

/**
 * 배송지 삭제(물리 삭제). 지운 것이 기본이었고 다른 배송지가 남아 있으면 백엔드가 자동 승격한다.
 * 응답은 200에 본문이 없다.
 *
 * `DELETE /api/shipping-addresses/{id}`
 */
export async function deleteAddress(id: string): Promise<void> {
  await apiFetch(`/api/shipping-addresses/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

/**
 * 기본 배송지 지정. 기존 기본 해제와 새 기본 지정이 한 트랜잭션이다.
 * 동시에 바꾸면 409 `SHIP_004`가 온다(재시도 안내).
 *
 * `PATCH /api/shipping-addresses/{id}/default`
 */
export async function setDefaultAddress(id: string): Promise<void> {
  await apiFetch(`/api/shipping-addresses/${encodeURIComponent(id)}/default`, { method: 'PATCH' });
}
