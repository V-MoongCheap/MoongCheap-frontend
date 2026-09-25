'use client';

import { CloseIcon } from '@/components/ui/Icons';
import { RECENT_SEARCHES } from '@/constants/searchMessages';

// B-05 최근 검색어. 시안 `1153:72650`.
//
// 헤더행(제목 + 전체삭제)과 항목 목록으로 나뉜다. 항목 하나는 검색어 버튼과 삭제 버튼 두 개를
// 나란히 두는데, 버튼 안에 버튼을 넣으면 HTML 위반이라 형제로 둔다(시안도 두 영역이 분리돼 있다).
//
// ⚠️ 기록이 없을 때의 시안이 없다. 새 화면을 그리지 않고 섹션 전체를 감춘다 - 제목만 남기면
//    '전체삭제'가 지울 것 없이 떠 있게 된다.

interface RecentSearchesProps {
  keywords: readonly string[];
  onSelect: (keyword: string) => void;
  onRemove: (keyword: string) => void;
  onClear: () => void;
}

export function RecentSearches({ keywords, onSelect, onRemove, onClear }: RecentSearchesProps) {
  if (keywords.length === 0) {
    return null;
  }

  return (
    <section className="mt-5 flex w-full flex-col gap-4 px-4">
      <div className="flex w-full items-center justify-between">
        <h2 className="text-section-title-16 text-content-primary">{RECENT_SEARCHES.title}</h2>
        {/* 시안 `1153:72653` - 라운드 박스(px-4 py-2) 안 텍스트. 배경은 없고 터치 영역만 넓힌다. */}
        <button
          className="rounded-round text-label-12 text-content-tertiary flex items-center justify-center px-1 py-0.5"
          onClick={onClear}
          type="button"
        >
          {RECENT_SEARCHES.clearAll}
        </button>
      </div>

      {/* 시안 실측: 항목 높이 42, 항목 간격 11. */}
      <ul className="flex w-full flex-col gap-[11px]">
        {keywords.map((keyword) => (
          <li className="flex w-full items-stretch" key={keyword}>
            {/* 검색어 버튼이 삭제 버튼을 뺀 행 전체(높이 42)를 차지해야 한다. 글자 폭만 잡으면 글자
                밖 여백을 눌렀을 때 반응이 없다(#160). 시안의 상하 여백(4·8)은 버튼 안쪽에 둔다. */}
            <button
              className="text-body-14 text-content-secondary min-w-0 flex-1 truncate pt-1 pb-2 text-left"
              onClick={() => onSelect(keyword)}
              type="button"
            >
              {keyword}
            </button>
            {/* 시안 `1153:72658` - 30×30 터치 박스 안 18px 글리프. 바깥 여백이 행 높이 42를 만든다. */}
            <button
              aria-label={RECENT_SEARCHES.removeLabel(keyword)}
              className="text-content-quinary mt-1 mb-2 flex size-[30px] shrink-0 items-center justify-center"
              onClick={() => onRemove(keyword)}
              type="button"
            >
              <CloseIcon className="size-[18px]" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
