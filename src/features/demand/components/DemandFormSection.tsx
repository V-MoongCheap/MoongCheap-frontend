import type { ReactNode } from 'react';

// B-09 수요 등록/참여 폼의 섹션 껍데기. 제목 + 흰 카드 한 벌이다.
//
// 섹션이 6개(제품 상세 · 배송지 등록 · 희망가격 · 결제수단 · 대체 상품 동의 · 약관)인데 모양이
// 전부 같아서, 두 사람이 각자 만들면 여백이 어긋난다. 값을 여기 한 곳에만 둔다.
//
// 실측(시안 1153:71238):
//   좌우 여백 16 · 제목과 카드 사이 12 · 카드 radius 12 · 카드 안쪽 여백 16 · 섹션 사이 24
//
// ⚠️ 시안에서 카드 폭이 섹션마다 다르다. 6개 중 3개(배송지 361 · 결제수단 361 · 약관 361)가
//    좌우 여백 16으로 맞고, 나머지는 제품 상세 362 · 희망가격 367 · 대체 상품 동의 359로
//    최대 3px씩 어긋난다. 가장 많은 쪽(361/여백 16)으로 통일했다. 디자인 확인 대상.
//
// ⚠️ 제목 크기도 갈린다. 배송지 등록만 title-17(줄높이 28)이고 나머지 다섯은 title-18(30)이다.
//    다수인 title-18로 통일했다. 역시 확인 대상.

interface DemandFormSectionProps {
  /** 섹션 제목. 라디오 그룹이 `aria-labelledby`로 가리킬 수 있게 id를 붙인다. */
  title: string;
  /** 제목 요소의 id. 라디오 그룹을 쓰는 섹션은 이 값을 `RadioGroup`에 넘긴다. */
  titleId: string;
  /** 제목 오른쪽에 붙는 것. 대체 상품 동의의 물음표 아이콘처럼. */
  titleAction?: ReactNode;
  /** 카드 아래에 붙는 회색 안내문. `최대 48시간 동안 낙찰대기돼요!` 같은 것. 오른쪽 정렬(디자인 QA 9/28). */
  note?: string;
  children: ReactNode;
}

export function DemandFormSection({
  title,
  titleId,
  titleAction,
  note,
  children,
}: DemandFormSectionProps) {
  return (
    <section className="flex w-full flex-col gap-3 px-4">
      <div className="flex items-center gap-2">
        <h2 className="text-title-18 text-content-primary" id={titleId}>
          {title}
        </h2>
        {titleAction}
      </div>

      <div className="bg-background-default rounded-12 flex w-full flex-col p-4">{children}</div>

      {note !== undefined && (
        <p className="text-caption-12 text-content-tertiary text-right">{note}</p>
      )}
    </section>
  );
}
