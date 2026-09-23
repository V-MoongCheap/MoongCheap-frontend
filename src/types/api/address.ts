/**
 * 배송지 백엔드 DTO.
 *
 * `types/address.ts`(화면용 `Address`)와 역할이 다르다. 여기는 **백엔드 응답을 그대로 옮긴 것**이고,
 * 화면용 타입으로의 변환은 `lib/addressApi.ts`가 맡는다. 필드명·타입이 백엔드를 따라가므로
 * 명세가 바뀌면 이 파일과 변환 함수만 고치면 되고 화면은 건드리지 않는다.
 *
 * 출처: 백엔드 Swagger(`api-docs(1).yaml`, 2026-08-31) `ShippingAddress*Dto`.
 */

/** `GET /api/shipping-addresses`, `GET /api/shipping-addresses/{id}` 응답. */
export interface ShippingAddressResponseDto {
  id: number;
  /** 배송지명. 화면의 `name`. */
  alias: string;
  recipientName: string;
  /**
   * 전화번호. ⚠️ 이름과 달리 조회 경로마다 마스킹 여부가 다르다(백엔드 aac2c39, 2026-09-22).
   * - 목록: 마스킹(`010-****-5678`)
   * - 단건: 하이픈 없는 원본(`01012345678`) — 수정 폼 프리필용
   */
  phoneNumberMasked: string;
  /** 우편번호 5자리. 화면의 `postalCode`. */
  zipcode: string;
  address: string;
  /** 선택 필드라 null일 수 있다(아래 둘도 같다). */
  addressDetail: string | null;
  entranceCode: string | null;
  requestMessage: string | null;
  isDefault: boolean;
}

/**
 * `POST /api/shipping-addresses` 요청 바디.
 *
 * `setAsDefault`는 등록에만 있다. 기존 배송지의 기본 지정은 별도 엔드포인트
 * (`PATCH /api/shipping-addresses/{id}/default`)를 쓴다.
 */
export interface ShippingAddressRequestDto {
  /** 최대 20자. */
  alias: string;
  /** `^[가-힣a-zA-Z\s]{2,20}$` */
  recipientName: string;
  /** `^0\d{1,2}-?\d{3,4}-?\d{4}$` — 하이픈 유무 모두 허용한다. */
  phoneNumber: string;
  /** `\d{5}` */
  zipcode: string;
  /** 최대 255자. */
  address: string;
  /** 최대 100자. */
  addressDetail?: string;
  /** 최대 20자. */
  entranceCode?: string;
  /** 배송 요청사항. 최대 100자. 시안과 폼에 없다. 등록은 생략, 수정은 기존 값을 보존해 보낸다. */
  requestMessage?: string;
  setAsDefault?: boolean;
}

/** `PATCH /api/shipping-addresses/{id}` 요청 바디. 등록과 같고 `setAsDefault`만 빠진다. */
export type ShippingAddressEditRequestDto = Omit<ShippingAddressRequestDto, 'setAsDefault'>;

/**
 * 배송지 관련 비즈니스 에러 코드. 출처: 백엔드 `docs/api-error-responses.md`.
 * 화면이 `ApiError.code`로 분기할 때 문자열을 직접 적지 않도록 모아 둔다.
 */
export const ADDRESS_ERROR_CODE = {
  /** 404 배송지를 찾을 수 없습니다. */
  notFound: 'SHIP_001',
  /** 400 배송지는 최대 5개까지 등록할 수 있습니다. (`ADDRESS_MAX`와 같은 값) */
  limitExceeded: 'SHIP_002',
  /** 403 본인 소유의 배송지가 아닙니다. */
  forbidden: 'SHIP_003',
  /** 409 기본 배송지 변경이 충돌했습니다. 다시 시도해주세요. */
  defaultConflict: 'SHIP_004',
} as const;
