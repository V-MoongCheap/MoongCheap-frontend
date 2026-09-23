import { z } from 'zod';

/**
 * 배송지 등록·수정(B-30) 폼 검증 스키마.
 *
 * 시안에 오류 문구가 없다. 확인 버튼이 비활성/활성 두 상태로만 그려져 있어, 오류를 글로
 * 보여 주는 대신 **채워질 때까지 버튼을 잠그는** 방식이 시안에 맞는다. 그래서 메시지는
 * 화면에 뜨지 않고 유효/무효 판정에만 쓰인다. 디자인에서 오류 문구가 나오면 그때 노출한다.
 *
 * 제약은 `FN-B30-02` 입력 항목 정의와 백엔드 `ShippingAddressRequestDto`에서 옮겼다.
 * 두 문서가 같은 값을 말하고 있어, 어느 한쪽이 바뀌면 이 파일만 고치면 된다.
 */

/** 저장값은 하이픈 없는 숫자 11자다(FN-B30-02 "숫자 11자 / 저장 시 하이픈 제거"). */
export const PHONE_PATTERN = /^01\d{9}$/;

/** 받는 분은 한글·영문 2~20자만 받는다. 숫자·특수문자는 백엔드가 거부한다. */
export const RECIPIENT_PATTERN = /^[가-힣a-zA-Z]{2,20}$/;

/** 우편번호는 검색 결과가 채우는 5자리 숫자다. */
const POSTAL_CODE_PATTERN = /^\d{5}$/;

/**
 * 입력칸 `maxLength`와 스키마가 같은 값을 보게 상수로 뺀다.
 *
 * 받는 분·휴대폰은 길이가 정규식 안에 들어 있어 상수와 두 곳에 적히게 된다. 값이 갈리면
 * 입력은 되는데 제출만 막히는 상태가 되므로, 고칠 때 정규식도 같이 본다.
 */
export const ADDRESS_DETAIL_MAX_LENGTH = 100;
export const ENTRANCE_CODE_MAX_LENGTH = 20;
export const ADDRESS_NAME_MAX_LENGTH = 20;
/** RECIPIENT_PATTERN의 상한과 같다. */
export const RECIPIENT_MAX_LENGTH = 20;
/** PHONE_PATTERN이 요구하는 `01` + 9자리. */
export const PHONE_MAX_LENGTH = 11;

export const addressSchema = z
  .object({
    // 우편번호·기본주소는 검색 결과가 채우는 읽기 전용 값이다. 사용자가 직접 못 쓰지만,
    // 형식까지 확인해 두면 검색 응답이 바뀌었을 때 저장 전에 걸린다.
    postalCode: z.string().regex(POSTAL_CODE_PATTERN),
    address: z.string().min(1),
    // 명세·백엔드 모두 **선택**이다. 필수로 두면 동·호수가 없는 주소를 등록할 수 없다.
    addressDetail: z.string().max(ADDRESS_DETAIL_MAX_LENGTH),
    entranceCode: z.string().max(ENTRANCE_CODE_MAX_LENGTH),
    /** 공동현관번호 없음. 체크하면 entranceCode를 비우고 잠근다. */
    noEntranceCode: z.boolean(),
    name: z.string().min(1, '배송지명을 입력해주세요.').max(ADDRESS_NAME_MAX_LENGTH),
    recipient: z.string().regex(RECIPIENT_PATTERN, '받는 분을 확인해주세요.'),
    phone: z.string().regex(PHONE_PATTERN, '휴대폰 번호를 확인해주세요.'),
    isDefault: z.boolean(),
  })
  // 체크를 안 했으면 공동현관번호는 필수다. 둘 다 비면 목록에 '미입력'으로 남는데,
  // 그 상태를 의도한 것인지 실수인지 구분할 수 없어 체크박스로 명시하게 한다.
  .refine((values) => values.noEntranceCode || values.entranceCode.trim().length > 0, {
    path: ['entranceCode'],
    message: '공동현관번호를 입력하거나 없음을 선택해주세요.',
  });

export type AddressFormValues = z.infer<typeof addressSchema>;
