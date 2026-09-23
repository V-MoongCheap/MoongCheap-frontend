import type { Metadata } from 'next';

import { AppBar } from '@/components/layout/AppBar';
import { AddressEditView } from '@/features/user/components/AddressEditView';

export const metadata: Metadata = {
  title: '배송지 수정',
};

// B-30 배송지 수정. 목록 카드의 '수정'으로 진입한다. `FN-B30-02`.
//
// 시안에 수정 프레임이 따로 없다. 기능정의서가 등록·수정을 한 화면으로 묶고 타이틀만
// '배송지 추가' / '배송지 수정'으로 가른다고 해서 폼을 그대로 재사용한다.
//
// 조회와 저장 배선은 `AddressEditView`가 맡는다(등록 화면과 같은 이유 — SID httpOnly 쿠키).
//
// 생성 타입(PageProps)은 `next build` 전에 존재하지 않아 typecheck에서 깨지므로 params를
// 직접 타이핑한다(src/app/layout.tsx와 같은 이유).
export default async function AddressEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="bg-background-default flex w-full flex-1 flex-col">
      <AppBar backHref="/mypage/addresses" title="배송지 수정" />
      <AddressEditView addressId={id} successHref="/mypage/addresses" />
    </main>
  );
}
