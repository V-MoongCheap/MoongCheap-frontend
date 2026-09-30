import { describe, expect, it } from 'vitest';

import {
  ADDRESS_DETAIL_MAX_LENGTH,
  addressSchema,
  createAddressSchema,
  type AddressFormValues,
} from '@/schemas/address';

const VALID: AddressFormValues = {
  postalCode: '06236',
  address: '서울 강남구 테헤란로 123',
  addressDetail: '101동 1001호',
  entranceCode: '#1234',
  noEntranceCode: false,
  name: '집',
  recipient: '홍길동',
  phone: '01012345678',
  isDefault: false,
};

/** 검증 실패한 필드 경로 목록. */
function failedPaths(values: AddressFormValues, schema = addressSchema): string[] {
  const result = schema.safeParse(values);
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'));
}

describe('addressSchema (등록)', () => {
  it('모든 값이 규칙에 맞으면 통과한다', () => {
    expect(failedPaths(VALID)).toEqual([]);
  });

  it('상세주소는 선택이라 비워도 통과하고, 상한을 넘으면 막는다', () => {
    expect(failedPaths({ ...VALID, addressDetail: '' })).toEqual([]);
    expect(
      failedPaths({ ...VALID, addressDetail: 'a'.repeat(ADDRESS_DETAIL_MAX_LENGTH + 1) }),
    ).toEqual(['addressDetail']);
  });

  it('우편번호는 5자리 숫자만 받는다', () => {
    expect(failedPaths({ ...VALID, postalCode: '1234' })).toEqual(['postalCode']);
  });

  it.each([
    ['한 글자', '홍'],
    ['숫자 포함', '홍길동1'],
    ['21자', '가'.repeat(21)],
  ])('받는 분이 %s이면 막는다', (_, recipient) => {
    expect(failedPaths({ ...VALID, recipient })).toEqual(['recipient']);
  });

  it.each([
    ['하이픈 포함', '010-1234-5678'],
    ['10자리', '0101234567'],
    ['01로 시작하지 않음', '02012345678'],
  ])('휴대폰 번호가 %s이면 막는다', (_, phone) => {
    expect(failedPaths({ ...VALID, phone })).toEqual(['phone']);
  });

  it('공동현관번호가 비어 있으면 없음 체크를 요구한다', () => {
    expect(failedPaths({ ...VALID, entranceCode: '  ' })).toEqual(['entranceCode']);
    expect(failedPaths({ ...VALID, entranceCode: '', noEntranceCode: true })).toEqual([]);
  });
});

describe('createAddressSchema (수정)', () => {
  // 백엔드 규칙이 더 넓어 프론트 정규식에 걸리는 저장값(공백 있는 이름·10자리 번호)
  const saved = { recipient: '홍 길동', phone: '0101234567' };

  it('불러온 저장값과 같으면 규칙에 어긋나도 통과시킨다', () => {
    const schema = createAddressSchema(saved);

    expect(failedPaths({ ...VALID, ...saved }, schema)).toEqual([]);
  });

  it('저장값에서 바꾼 값은 다시 규칙을 따른다', () => {
    const schema = createAddressSchema(saved);

    expect(failedPaths({ ...VALID, recipient: '홍 길 동', phone: '0101234568' }, schema)).toEqual([
      'recipient',
      'phone',
    ]);
  });

  it('빈 저장값은 인정하지 않아 빈 칸이 통과하지 않는다', () => {
    const schema = createAddressSchema({ recipient: '', phone: '' });

    expect(failedPaths({ ...VALID, recipient: '', phone: '' }, schema)).toEqual([
      'recipient',
      'phone',
    ]);
  });
});
