import type { Address } from '@/types/address';

/**
 * 배송지 목 데이터.
 *
 * `mocks/auth.ts`와 같은 규칙이다. 실제 연동 시 이 함수의 **본문만** API 호출로 교체하고
 * 반환 타입은 그대로 둔다.
 *
 * 값은 시안(B-30)에 적힌 예시를 그대로 옮겼다. 빈 목록 상태를 확인하려면 아래 배열을
 * 비우면 된다.
 */

const mockAddresses: Address[] = [
  {
    id: 'addr-1',
    name: '회사',
    isDefault: true,
    postalCode: '06060',
    address: '서울 강남구 학동로 343 (논현동, The Pinnacle Gangnam)',
    addressDetail: '15층',
    recipient: '김뭉치',
    phone: '01012341234',
  },
];

export async function mockGetAddresses(): Promise<Address[]> {
  return mockAddresses;
}

export async function mockGetAddress(id: string): Promise<Address | undefined> {
  return mockAddresses.find((address) => address.id === id);
}
