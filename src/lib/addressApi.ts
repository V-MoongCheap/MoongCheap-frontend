import type { AddressFormValues } from '@/schemas/address';
import type { Address } from '@/types/address';
import type {
  ShippingAddressEditRequestDto,
  ShippingAddressRequestDto,
  ShippingAddressResponseDto,
} from '@/types/api/address';
import type { IdResponse } from '@/types/api/common';

import { apiFetch } from './api';

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

/**
 * 응답 DTO를 화면용 타입으로 옮긴다.
 *
 * ⚠️ `phone`에 들어가는 값은 **마스킹된 문자열**(`010-****-5678`)이다. 백엔드가 원본을 주지 않는다.
 * 목록 카드는 `formatPhone`이 형식 불일치 시 원본을 그대로 돌려주므로 마스킹 값이 그대로 보인다
 * (의도한 표시다). 반면 수정 화면은 이 값을 입력칸에 채울 수 없다 — 그대로 저장하면 백엔드
 * 정규식에 걸린다. 그래서 수정은 아직 목을 쓴다.
 */
function toAddress(dto: ShippingAddressResponseDto): Address {
  return {
    // 화면·라우트 파라미터가 문자열이라 여기서 한 번만 맞춘다.
    id: String(dto.id),
    name: dto.alias,
    isDefault: dto.isDefault,
    postalCode: dto.zipcode,
    address: dto.address,
    addressDetail: dto.addressDetail,
    // 카드가 `미입력`을 보여주는 기준이 undefined다. 빈 문자열이 오면 없는 것으로 본다.
    entranceCode: dto.entranceCode === '' ? undefined : dto.entranceCode,
    recipient: dto.recipientName,
    phone: dto.phoneNumberMasked,
  };
}

/**
 * 폼 값을 수정 바디로 옮긴다. 등록 바디는 여기에 `setAsDefault`만 더한 모양이다.
 *
 * `noEntranceCode`는 입력을 잠그는 UI 상태라 보내지 않는다. 체크되면 폼이 `entranceCode`를
 * 비우므로 값만 봐도 된다.
 *
 * `requestMessage`(배송 요청사항)는 백엔드에 있으나 시안과 폼에 없어 보내지 않는다. 선택 필드라
 * 생략해도 등록된다. 디자인 확인 후 폼이 생기면 여기에 더한다.
 */
function toEditRequestDto(values: AddressFormValues): ShippingAddressEditRequestDto {
  return {
    alias: values.name,
    recipientName: values.recipient,
    // 폼은 하이픈 없이 받는다. 백엔드 정규식이 하이픈 유무를 모두 허용해 그대로 보낸다.
    phoneNumber: values.phone,
    zipcode: values.postalCode,
    address: values.address,
    addressDetail: values.addressDetail,
    entranceCode: values.entranceCode,
  };
}

/** 등록 바디는 수정 바디에 `setAsDefault`만 더한 모양이다. */
function toCreateRequestDto(values: AddressFormValues): ShippingAddressRequestDto {
  return { ...toEditRequestDto(values), setAsDefault: values.isDefault };
}

/**
 * 배송지 목록. 백엔드가 **기본 배송지 우선, 최근 등록순**으로 정렬해 준다(`BR-B30-01`).
 * 프론트에서 다시 정렬하지 않는다.
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
  const data = (await response.json()) as IdResponse;
  return String(data.id);
}

/**
 * 배송지 수정. 기본 지정은 이 요청으로 바꿀 수 없고 별도 엔드포인트를 쓴다.
 *
 * ⚠️ 조회 응답에 원본 전화번호가 없어 수정 화면을 아직 배선하지 못한다. 백엔드 회신 후 연결한다.
 *
 * `PATCH /api/shipping-addresses/{id}`
 */
export async function updateAddress(id: string, values: AddressFormValues): Promise<void> {
  await apiFetch(`/api/shipping-addresses/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toEditRequestDto(values)),
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
