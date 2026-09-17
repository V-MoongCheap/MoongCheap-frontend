'use client';

import { Check } from 'lucide-react';

import {
  DEMAND_CONSENT_ALL_LABEL,
  DEMAND_FORM_CONSENTS,
  type DemandConsentKey,
} from '@/constants/demandFormMessages';
import { cn } from '@/lib/cn';

// B-09 약관 동의 섹션. 시안 `1153:71336` · `1153:71463` · `1153:71709`.
//
// 다른 섹션과 달리 제목도 카드도 없다. 전체동의 한 줄과 필수 동의 줄들(`DEMAND_FORM_CONSENTS`)이
// 전부다. 항목 수는 그 목록을 따라가므로 여기서 개수를 박지 않는다(백엔드 규격에 맞춰 4개).
//
// 필수 동의 줄은 체크박스가 아니라 **체크 표시**다(시안 컴포넌트 `universal/check` 20x20). 네모 상자
// 없이 체크 아이콘만 있고, 안 켜진 상태는 회색이다. 그래서 공용 `Checkbox`를 쓰지 않고 직접
// 그린다. 전체동의만 네모 체크박스다.
//
// 실측(픽셀 직접 샘플): 전체동의 상자 20x20 · 테두리 2 #e6e6e6 · 라벨 caption-12 #575757 ·
// 아래 3줄 아이콘 20 회색 #b2b2b2 · 라벨 caption-12 #303030 · 줄 간격 12 · 아이콘과 글자 8.
//
// ⚠️ 켜진 상태의 색이 어느 시안에도 없다. 세 프레임 모두 전부 꺼진 상태다. 앱의 긍정 색인
//    브랜드 코랄을 썼고(공용 `Checkbox`의 체크 색과 같은 계열), 확정되면 여기만 고친다.

/** 전부 켜졌는지. 전체동의 상자의 상태이기도 하다. */
function isAllChecked(consents: Record<DemandConsentKey, boolean>): boolean {
  return DEMAND_FORM_CONSENTS.every(({ key }) => consents[key]);
}

interface ConsentSectionProps {
  consents: Record<DemandConsentKey, boolean>;
  onConsentsChange: (consents: Record<DemandConsentKey, boolean>) => void;
}

export function ConsentSection({ consents, onConsentsChange }: ConsentSectionProps) {
  const allChecked = isAllChecked(consents);

  /** 전체동의는 3개를 한 번에 켜고 끈다. 3개가 다 켜지면 전체동의도 켜진 것으로 본다. */
  function toggleAll() {
    const next = !allChecked;
    onConsentsChange(
      Object.fromEntries(DEMAND_FORM_CONSENTS.map(({ key }) => [key, next])) as Record<
        DemandConsentKey,
        boolean
      >,
    );
  }

  return (
    <section className="flex w-full flex-col gap-2 px-4">
      {/* 시안: 좌우 여백이 카드보다 16 더 들어간다(카드 없는 섹션이라 안쪽 여백만큼 맞춘 것). */}
      <div className="flex w-full flex-col gap-3 px-4">
        <label className="flex items-center gap-2">
          <span className="relative flex size-5 shrink-0">
            <input
              checked={allChecked}
              className="peer sr-only"
              onChange={toggleAll}
              type="checkbox"
            />
            <span
              aria-hidden
              className="border-border-disabled-primary rounded-4 text-content-oncolor peer-checked:bg-surface-brand peer-checked:border-surface-brand peer-focus-visible:ring-effect-focus-ring-primary flex size-5 items-center justify-center border-2 peer-focus-visible:ring-2 peer-focus-visible:ring-offset-1 peer-checked:[&_svg]:opacity-100"
            >
              <Check className="size-3.5 opacity-0" strokeWidth={3} />
            </span>
          </span>
          <span className="text-caption-12 text-content-tertiary">{DEMAND_CONSENT_ALL_LABEL}</span>
        </label>

        {DEMAND_FORM_CONSENTS.map(({ key, label }) => (
          <label className="flex items-center gap-2" key={key}>
            <input
              checked={consents[key]}
              className="peer sr-only"
              onChange={(event) => onConsentsChange({ ...consents, [key]: event.target.checked })}
              type="checkbox"
            />
            {/* input이 sr-only라 포커스 링을 이 표시 아이콘이 대신 받는다. 없으면 키보드로
                내려올 때 지금 어느 줄에 있는지 보이지 않는다. 위 전체동의 상자와 같은 링이다. */}
            <Check
              aria-hidden
              className={cn(
                'rounded-4 peer-focus-visible:ring-effect-focus-ring-primary size-5 shrink-0 peer-focus-visible:ring-2 peer-focus-visible:ring-offset-1',
                consents[key] ? 'text-content-brand' : 'text-content-quinary',
              )}
              strokeWidth={2}
            />
            <span className="text-caption-12 text-content-secondary">{label}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
