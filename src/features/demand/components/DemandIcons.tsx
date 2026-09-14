// B-09 전용 아이콘. 시안 컴포넌트 `inner-circle-notice/question-mark-filled`(24x24).
//
// lucide의 `CircleQuestionMark`는 테두리만 있는 형태라 시안(채워진 원 + 흰 물음표)과 다르다.
// 화면 하나에서만 쓰여 features 아래 둔다. 두 번째 사용처가 생기면 components/ui로 올린다.

export function CircleQuestionIcon() {
  return (
    <svg aria-hidden fill="none" height="24" viewBox="0 0 24 24" width="24">
      <circle cx="12" cy="12" fill="currentColor" r="9" />
      <path
        d="M10.1 9.5a1.9 1.9 0 1 1 2.6 1.8c-.5.2-.7.6-.7 1.1v.4"
        stroke="#ffffff"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="16" fill="#ffffff" r="0.9" />
    </svg>
  );
}
