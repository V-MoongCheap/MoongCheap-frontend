import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

import { ComingSoonButton } from '@/components/ui/ComingSoonButton';
import { GoBackButton } from '@/components/ui/GoBackButton';
import { CartIcon, CircleXIcon } from '@/components/ui/Icons';
import { SEARCH_INPUT_LABEL } from '@/constants/searchMessages';

// B-06 상단 바. 시안 `818:9620`(search-results-bar의 `icon` 변형).
//
// B-05와 달리 앱바가 따로 없다. 이 한 줄이 뒤로가기 · 검색어 · 지우기 · 장바구니를 다 갖는다.
// 그래서 공용 `AppBar`를 쓰지 않는다.
//
// 검색어 칸은 입력창이 아니라 **B-05로 돌아가는 링크**다. 편집은 B-05에서 한다(시안이 두 화면을
// 나눠 뒀다). 지우기(x)는 검색어 없이 B-05로 보낸다.
//
// 지우기 버튼을 검색어 링크 안에 넣으면 링크 안의 링크가 되어 HTML 위반이라 형제로 둔다.

interface SearchQueryBarProps {
  /** 현재 검색어. 칸에 그대로 그린다. */
  query: string;
  /** 검색 입력 화면(B-05) 경로. 라우트는 호출부(page)가 정한다. */
  searchHref: string;
}

export function SearchQueryBar({ query, searchHref }: SearchQueryBarProps) {
  return (
    <div className="flex w-full items-center gap-1 px-2 py-3">
      <div className="flex min-w-0 flex-1 items-center">
        {/* 시안: 34 박스 안 24 글리프. 색은 #303030(content/secondary)으로 B-05 앱바의
            chevron(#575757)과 다르다. 각 화면의 시안값을 그대로 따른다. */}
        {/* 뒤로 가기는 링크가 아니라 `GoBackButton`이다(#165). 링크(push)면 B-05가 히스토리에 새로
            쌓이고, B-05 앱바의 뒤로 가기(back)가 다시 이 화면을 열어 두 화면을 무한히 오갔다. */}
        <GoBackButton
          className="text-content-secondary flex size-[34px] shrink-0 items-center justify-center"
          fallbackHref={searchHref}
        >
          <ChevronLeft aria-hidden className="size-6" />
          <span className="sr-only">뒤로 가기</span>
        </GoBackButton>

        {/* 시안: 높이 40, radius 20. B-05의 알약(radius round)과 값이 다르다. */}
        <div className="bg-surface-secondary rounded-20 flex h-10 min-w-0 flex-1 items-center gap-2 px-4 py-1">
          <Link
            className="text-section-title-16 text-content-primary min-w-0 flex-1 truncate"
            href={`${searchHref}?q=${encodeURIComponent(query)}`}
          >
            {query}
          </Link>
          <Link
            aria-label={`${SEARCH_INPUT_LABEL}어 지우기`}
            className="text-content-quinary flex size-6 shrink-0 items-center justify-center"
            href={searchHref}
          >
            <CircleXIcon className="size-[18px]" />
          </Link>
        </div>
      </div>

      {/* 시안: 40 박스 안 22 글리프. B-05 앱바(24)보다 작다. */}
      <ComingSoonButton className="flex size-10 shrink-0 items-center justify-center">
        <CartIcon className="text-content-secondary size-[22px]" />
        <span className="sr-only">장바구니</span>
      </ComingSoonButton>
    </div>
  );
}
