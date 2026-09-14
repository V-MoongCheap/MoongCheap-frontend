'use client';

import { Minus, Plus } from 'lucide-react';

import { ORDER_QUANTITY_MAX, ORDER_QUANTITY_MIN } from '@/constants/businessRules';

// 수량 스테퍼. 시안 `I1153:71245;633:5073`(제품 상세 카드 안).
//
// 실측: 묶음 90x24 · `background/subtle` 바탕 · 버튼 24x24(아이콘 16) · 값 칸 24 ·
//       사이 간격 8 · 세 칸 모두 가운데 정렬.
//
// 범위는 `ORDER_QUANTITY_MIN`~`MAX`(FN-B09-01)다. 끝에 닿으면 버튼을 `disabled`로 잠근다.
// 시안에 잠긴 모양이 없어 색을 새로 정하는 대신 투명도만 낮췄다(Checkbox와 같은 방침).

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  /** 어떤 상품의 수량인지. 화면에는 안 보이고 읽어 주는 도구에만 전달된다. */
  label: string;
}

const BUTTON_CLASS =
  'text-content-primary focus-visible:ring-effect-focus-ring-primary rounded-round flex size-6 items-center justify-center outline-none focus-visible:ring-2 disabled:opacity-30';

export function QuantityStepper({ value, onChange, label }: QuantityStepperProps) {
  return (
    <div className="bg-background-subtle rounded-4 flex h-6 items-center gap-2">
      <button
        aria-label={`${label} 수량 줄이기`}
        className={BUTTON_CLASS}
        disabled={value <= ORDER_QUANTITY_MIN}
        onClick={() => onChange(value - 1)}
        type="button"
      >
        <Minus className="size-4" />
      </button>

      {/* 값이 바뀌면 읽어 주는 도구가 알 수 있게 한다. 버튼을 눌러야 바뀌므로 alert까지는 아니다. */}
      <span aria-live="polite" className="text-body-14 text-content-primary w-6 text-center">
        {value}
      </span>

      <button
        aria-label={`${label} 수량 늘리기`}
        className={BUTTON_CLASS}
        disabled={value >= ORDER_QUANTITY_MAX}
        onClick={() => onChange(value + 1)}
        type="button"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
