'use client';

import { useState } from 'react';

import { Radio, RadioGroup } from '@/components/ui/Radio';
import { SUBSTITUTE_NOTE_MAX_LENGTH } from '@/constants/businessRules';
import { DEMAND_FORM_MESSAGES, DEMAND_FORM_SECTIONS } from '@/constants/demandFormMessages';
import { DemandFormSection } from '@/features/demand/components/DemandFormSection';
import { CircleQuestionIcon } from '@/features/demand/components/DemandIcons';

// B-09 대체 상품 동의 섹션. 시안 `1153:71324`(기본) · `1153:71479`(툴팁) · `1153:71709`(동의).
//
// `동의`를 고르면 그 아래에 조건 입력칸이 펼쳐진다. 길이 상한은 `SUBSTITUTE_NOTE_MAX_LENGTH`
// (FN-B09-03)다.
//
// 말풍선은 제목 위쪽에 뜬다(시안 `1153:71479`). 클릭으로 열고 닫는다 — 손가락에는 hover가 없어
// 마우스 전용으로 만들면 모바일에서 아예 열 수 없다.

export function SubstituteSection({
  agreed,
  note,
  onAgreedChange,
  onNoteChange,
}: {
  agreed: boolean | null;
  note: string;
  onAgreedChange: (agreed: boolean) => void;
  onNoteChange: (note: string) => void;
}) {
  const [tooltipOpen, setTooltipOpen] = useState(false);

  return (
    <DemandFormSection
      title={DEMAND_FORM_SECTIONS.substitute.title}
      titleId={DEMAND_FORM_SECTIONS.substitute.id}
      titleAction={
        <span className="relative flex items-center">
          <button
            aria-expanded={tooltipOpen}
            aria-label={`${DEMAND_FORM_SECTIONS.substitute.title} 설명`}
            className="text-content-quinary focus-visible:ring-effect-focus-ring-primary rounded-round outline-none focus-visible:ring-2"
            onClick={() => setTooltipOpen((open) => !open)}
            type="button"
          >
            <CircleQuestionIcon />
          </button>

          {tooltipOpen && (
            // 시안: 제목 위 검은 말풍선, 흰 글씨. 카드 폭을 넘지 않게 좌측 기준으로 펼친다.
            <span
              className="bg-surface-quinary text-content-oncolor text-caption-12 rounded-8 absolute bottom-full left-0 z-10 mb-2 w-70 px-3 py-2"
              role="tooltip"
            >
              {DEMAND_FORM_MESSAGES.substituteTooltip}
            </span>
          )}
        </span>
      }
    >
      <RadioGroup
        className="gap-4"
        labelledBy={DEMAND_FORM_SECTIONS.substitute.id}
        name="demand-substitute"
      >
        <div className="flex w-full flex-col gap-4">
          <Radio
            checked={agreed === true}
            label={DEMAND_FORM_MESSAGES.substituteAgree}
            name="demand-substitute"
            onChange={() => onAgreedChange(true)}
            value="agree"
          />

          {/* 시안: `동의`를 고른 뒤에만 나타난다. */}
          {agreed === true && (
            <input
              aria-label={DEMAND_FORM_MESSAGES.substituteNotePlaceholder}
              className="border-border-quarternary rounded-8 text-body-14 text-content-primary placeholder:text-content-quinary focus-visible:border-border-secondary h-12 w-full border px-3 outline-none"
              maxLength={SUBSTITUTE_NOTE_MAX_LENGTH}
              onChange={(event) => onNoteChange(event.target.value)}
              placeholder={DEMAND_FORM_MESSAGES.substituteNotePlaceholder}
              value={note}
            />
          )}
        </div>

        <Radio
          checked={agreed === false}
          label={DEMAND_FORM_MESSAGES.substituteDisagree}
          name="demand-substitute"
          onChange={() => onAgreedChange(false)}
          value="disagree"
        />
      </RadioGroup>
    </DemandFormSection>
  );
}
