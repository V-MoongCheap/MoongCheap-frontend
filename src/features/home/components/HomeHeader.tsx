import Link from 'next/link';

import { ComingSoonButton } from '@/components/ui/ComingSoonButton';
import { BellIcon, CartIcon, SearchIcon } from '@/components/ui/Icons';
import { HOME_SEARCH_PLACEHOLDER } from '@/constants/homeMessages';

import { HomeLogotype } from './HomeLogotype';

// 홈 상단. 시안 `981:18160`(GNB) + `981:18161`(검색바).
//
// GNB 왼쪽은 글자 대신 로고타입이다(디자인 QA 9/28 '로고 수정', `HomeLogotype`). 제목(h1)은 그대로
// 두고 로고가 이름('뭉치')을 보조기술에 전달한다.
//
// 알림(B-25)·장바구니(B-13)는 둘 다 Full 범위라 화면이 없다. 시안에 있는 진입점이라 노출은
// 하고 탭하면 '준비 중' 토스트를 띄운다(의사결정 기록 2026-08-28).
//
// 검색바는 입력창이 아니라 검색 화면(B-05)으로 가는 링크다. B-05가 생겨 '준비 중' 토스트에서
// 링크로 바꿨다(#63).

/** 시안: 52×52 터치 영역 안에 24 아이콘. */
const GNB_ACTION_CLASS = 'flex size-13 items-center justify-center p-3';

export function HomeHeader() {
  return (
    <header className="flex w-full flex-col">
      <div className="flex w-full items-center justify-between px-4">
        <h1 className="text-content-secondary flex min-w-0 flex-1 items-center">
          <HomeLogotype />
        </h1>
        <div className="flex items-center">
          <ComingSoonButton className={GNB_ACTION_CLASS}>
            <BellIcon className="text-content-secondary size-6" />
            <span className="sr-only">알림</span>
          </ComingSoonButton>
          <ComingSoonButton className={GNB_ACTION_CLASS}>
            <CartIcon className="text-content-secondary size-6" />
            <span className="sr-only">장바구니</span>
          </ComingSoonButton>
        </div>
      </div>

      <div className="flex w-full items-center justify-center px-4 py-3">
        <Link
          className="bg-surface-secondary rounded-round flex h-10 w-full items-center gap-2 px-4 py-0.5"
          href="/search"
        >
          <span className="text-section-title-16 text-content-disabled-secondary min-w-0 flex-1 text-left">
            {HOME_SEARCH_PLACEHOLDER}
          </span>
          <SearchIcon className="text-content-quarternary size-6 shrink-0" />
        </Link>
      </div>
    </header>
  );
}
