import type { Metadata } from 'next';

import { AppBar } from '@/components/layout/AppBar';
import { PaymentMethodManager } from '@/features/user/components/PaymentMethodManager';

export const metadata: Metadata = {
  title: '결제수단 관리',
};

// B-14 결제수단 관리(FN-B14-01). 마이페이지 설정 '결제수단 등록 • 변경'에서 진입한다.
//
// 목록 조회와 모드 전환·기본변경은 PaymentMethodManager(client)가 맡는다. 세션이 SID httpOnly
// 쿠키라 서버 컴포넌트에서 조회하면 쿠키 없이 나가 401이 된다(`usePaymentMethods` 주석).
// 마이페이지 셸이 background/subtle을 깔지만 이 화면은 카드 배경이 흰 바탕이라 background/default로 덮는다.
//
// backHref는 /mypage로 고정한다. 기본변경 모드 → 조회 모드로 되돌리는 단계별 백(BR-B14-01-13)은
// 뒤로가기 가로채기가 필요해 이번 범위에서 뺐다(Manager 주석 참고).
export default function PaymentMethodsPage() {
  return (
    <main className="bg-background-default flex w-full flex-1 flex-col">
      <AppBar backHref="/mypage" title="결제수단 관리" />
      <PaymentMethodManager />
    </main>
  );
}
