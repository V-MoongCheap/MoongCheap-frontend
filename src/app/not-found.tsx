import { NotFoundScreen } from '@/components/ui/NotFoundScreen';

// 404(#44). 아직 화면이 없는 진입점이 여러 개라 실제로 도달한다
// (결제수단·회원정보 변경·비밀번호 변경·닉네임 변경·프로필 이미지 변경·판매자 전환·주문 내역).
//
// 404 전용 시안이 없어 '모든화면 error 페이지'(453:26351)를 그대로 쓴다. 문구도 그대로다.
//
// ⚠️ 버튼 동작은 잠정이다. 지금은 뒤로 가기로 두고, 이후 같은 주소 새로고침으로 바꾼다.
//    라벨이 '다시 시도'라 새로고침이 의미상 맞지만, 아직 안 만든 화면 7곳에서 눌리면
//    같은 404가 다시 떠 제자리를 돌게 된다. 해당 화면들이 채워진 뒤에 교체한다.
//    (히스토리가 없는 진입 — 주소 직접 입력·외부 유입 — 에서는 back()이 아무 일도 하지 않는다.)
//
// 메타데이터는 루트 레이아웃 것을 그대로 쓴다. 404 전용 제목은 시안·명세에 근거가 없다.
//
// not-found.tsx는 App Router 예약 파일이라 default export를 쓴다(프로젝트 규칙의 예외).
export default function NotFound() {
  return (
    <div className="max-w-mobile mx-auto flex min-h-svh w-full flex-col">
      <NotFoundScreen />
    </div>
  );
}
