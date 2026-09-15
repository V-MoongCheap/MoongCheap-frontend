import type { MyPageOverview } from '@/types/user';

/**
 * 회원 목 데이터.
 *
 * `mocks/auth.ts`와 같은 규칙이다. 실제 연동 시 이 함수의 **본문만** API 호출로 교체하고
 * 반환 타입은 그대로 둔다. 화면은 반환 타입만 알고 있으므로 교체 시 화면을 고치지 않는다.
 *
 * 폼 목(`mocks/auth.ts`)과 달리 지연을 넣지 않는다. 서버 컴포넌트에서 호출하므로 지연이
 * 그대로 응답 시간이 된다. 실제 API가 붙으면 그때 `loading.tsx`를 함께 만든다.
 */

const mockOverview: MyPageOverview = {
  nickname: '김뭉치',
  email: 'moongcheap@gmail.com',
  // 판매자 시트(시안 453:25351)를 확인하려면 'seller'로 바꾼다.
  role: 'buyer',
  orderProgress: {
    PAYMENT_COMPLETED: 0,
    DELIVERY_REQUESTED: 0,
    PREPARING: 1,
    SHIPPING: 0,
    DELIVERED: 0,
  },
};

export async function mockGetMyPageOverview(): Promise<MyPageOverview> {
  return mockOverview;
}
