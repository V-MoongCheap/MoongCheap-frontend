import type { ReactNode } from 'react';

import { ChevronLeft } from 'lucide-react';

import { GoBackButton } from '@/components/ui/GoBackButton';

// 하위 화면 공통 상단 앱바. Figma `icon+text` 컴포넌트(399:20414 · 818:9977)에 대응한다.
//
// B-24 프로필 설정에 인라인으로 두었던 것을 B-25 알림 설정이 같은 모양을 쓰게 되어 올렸다.
// (컨벤션의 2회 규칙 - 두 번째 사용처가 생기면 추출한다.)
//
// 시안 컴포넌트는 제목 오른쪽에 `rightIcon`(아이콘 하나)·`textButton`("편집") 두 변형을 갖는다.
// B-05 검색 입력이 `rightIcon`(장바구니)을 쓰게 되어 `action` 슬롯으로 열었다. 둘 다 같은 자리에
// 들어가므로 무엇을 넣을지는 호출부가 정한다.
//
// 뒤로 가기는 `next/link`가 아니라 `GoBackButton`이다. 링크는 replace를 주지 않으면 push라서,
// 뒤로 가기를 눌러도 되돌아가는 게 아니라 히스토리에 한 항목이 더 쌓인다. 그래서 상품 상세처럼
// `router.back()`을 쓰는 화면과 이어지면 두 화면을 서로 오가며 빠져나올 수 없었다(#138).
//
// `onBack`을 주면 이동을 호출부에 맡긴다. 입력 중인 폼이 이탈 확인 다이얼로그를 먼저 띄워야 하는
// 경우다(B-30 배송지 폼, #164). 함수 prop이라 이 경우 호출부는 client여야 한다.

interface AppBarProps {
  title: string;
  /** 돌아갈 히스토리가 없을 때 이동할 경로. 직접 진입(새로고침·딥링크·공유 링크)에서도 갈 곳이
   *  있어야 하므로 경로로 받는다. 히스토리가 있으면 `GoBackButton`이 그쪽을 먼저 쓴다. */
  backHref: string;
  /** 제목 오른쪽 액션(아이콘 버튼·"편집" 링크 등). 없으면 제목만 그린다. */
  action?: ReactNode;
  /** 뒤로 가기를 가로챈다. 주면 `backHref`로 이동하지 않고 이 함수만 부른다. */
  onBack?: () => void;
}

const BACK_BUTTON_CLASS = 'text-content-tertiary flex h-13 w-10 shrink-0 items-center px-2';

export function AppBar({ title, backHref, action, onBack }: AppBarProps) {
  const backIcon = (
    <>
      <ChevronLeft aria-hidden className="size-6" />
      <span className="sr-only">뒤로 가기</span>
    </>
  );

  return (
    <header className="border-divider-default flex h-13 w-full shrink-0 items-center border-b">
      {/* 시안의 chevron-left는 #575757(content/tertiary)이다. B-24에 인라인으로 짤 때
          content/primary로 넣었던 것을 여기서 바로잡는다. */}
      {onBack === undefined ? (
        <GoBackButton className={BACK_BUTTON_CLASS} fallbackHref={backHref}>
          {backIcon}
        </GoBackButton>
      ) : (
        <button className={BACK_BUTTON_CLASS} onClick={onBack} type="button">
          {backIcon}
        </button>
      )}
      {/* 시안 `818:9980` - 제목과 액션이 한 줄을 나눠 쓴다(justify-between). 액션이 없어도
          제목 위치가 바뀌면 안 되므로 flex-1은 이 줄이 갖는다. */}
      <div className="flex h-full min-w-0 flex-1 items-center justify-between">
        <h1 className="text-title-17 text-content-primary min-w-0 truncate">{title}</h1>
        {action}
      </div>
    </header>
  );
}
