import type { Metadata } from 'next';

import { AppBar } from '@/components/layout/AppBar';
import { AddressListView } from '@/features/user/components/AddressListView';

export const metadata: Metadata = {
  title: '배송지 목록',
};

// B-30 배송지 목록. 마이페이지 설정에서 진입한다. `FN-B30-01`.
//
// 2026-08-27 주문·결제 순서가 뒤집히면서 결제 성공 후에도 배송지를 입력하게 됐다. 다만 그
// 진입 경로(B-15 결제 화면)는 아직 만들어지지 않았고 라우트도 확정되지 않았다. 지금은 마이페이지
// 진입 하나뿐이라 backHref를 /mypage로 고정한다.
//
// 주문 쪽 진입이 생기면 그때 복귀 경로를 받아야 한다. 뒤로 가기를 history가 아니라 경로로 받는
// AppBar 규약이라 페이지가 값만 바꿔 넘기면 되고, 그 시점에 허용 목록 검증을 함께 넣는다.
//
// 목록 조회는 client 조각(`AddressListView`)이 맡는다. 세션이 SID httpOnly 쿠키라 서버
// 컴포넌트에서 부르면 쿠키 없이 나가 401이 된다(`useAddresses` 주석 참고).
export default function AddressListPage() {
  return (
    <main className="bg-background-default flex w-full flex-1 flex-col pb-6">
      <AppBar backHref="/mypage" title="배송지 목록" />
      <AddressListView createHref="/mypage/addresses/new" editBaseHref="/mypage/addresses" />
    </main>
  );
}
