import type { Metadata } from 'next';

import { AddressCreateView } from '@/features/user/components/AddressCreateView';

export const metadata: Metadata = {
  title: '배송지 등록',
};

// B-30 배송지 등록. 목록의 '새 배송지 추가'로 진입한다. `FN-B30-02`.
//
// 폼 전체가 상태를 갖고 우편번호 팝업까지 띄워야 해서 본문은 클라이언트 컴포넌트다.
// 앱바도 본문이 그린다. 뒤로 가기가 입력 변경 여부를 알아야 이탈 확인을 띄울 수 있다(#164).
//
// 목록 조회와 저장 배선은 `AddressCreateView`가 맡는다. 세션이 SID httpOnly 쿠키라 서버
// 컴포넌트에서 조회할 수 없고, 저장 콜백은 함수 prop이라 서버→클라 경계를 못 넘는다.
export default function AddressCreatePage() {
  return (
    <main className="bg-background-default flex w-full flex-1 flex-col">
      <AddressCreateView successHref="/mypage/addresses" title="배송지 등록" />
    </main>
  );
}
