import type { ComponentPropsWithRef, ReactNode } from 'react';

import { cn } from '@/lib/cn';

// Figma DS `radio` 컴포넌트(20x20).
//
// B-09 수요 등록/참여 한 화면에서만 세 번 쓰인다(희망가격 7 · 결제수단 4 · 대체 상품 동의 2).
// 그 전에도 라디오 마크업이 세 군데 흩어져 있었다.
//   src/app/(auth)/_components/ModeSelectStep.tsx
//   src/features/user/components/PaymentMethodCard.tsx
//   src/features/user/components/RoleSwitchSheet.tsx
// 기존 셋을 이 컴포넌트로 바꾸는 일은 여기서 하지 않는다. 화면 세 개의 회귀 위험을 B-09 작업과
// 섞지 않으려는 것으로, 별도 리팩터 이슈로 뺀다.
//
// Checkbox와 달리 `sr-only`가 아니라 `appearance-none`으로 input 자체를 그린다. 라디오는
// 방향키로 그룹 안을 옮겨 다니는 동작이 브라우저에 들어 있어서, 실물 input이 화면에 있어야
// 포커스 링이 눈에 보이는 자리에 뜬다. 그룹 묶기·토글·폼 제출값도 전부 기본 동작에 맡긴다.
//
// 실측(시안 1153:71257 계열, 픽셀 직접 샘플):
//   바깥 20x20 · 테두리 2 · 안쪽 점 12 · 테두리와 점 사이 2 · 라디오와 라벨 사이 8
//   미선택 테두리 #d6d6d6 · 선택 점 #434343 · 라벨 body-14 Medium
//
// ⚠️ 선택 점 색이 시안에서 `surface-tertiary`에 묶여 있는데 그 토큰의 값은 #e6e6e6(연회색)다.
//    실제 채움값 #434343과 맞는 토큰은 `surface-quinary`라 이름이 아니라 값을 따랐다. 다크에서
//    #f5f5f5로 뒤집혀 어두운 카드 위에 밝은 점이 되므로 두 모드 모두 성립한다.

type RadioProps = Omit<ComponentPropsWithRef<'input'>, 'type' | 'className'> & {
  label: ReactNode;
  className?: string;
  /**
   * 안쪽 점의 색만 따로 바꿀 때 쓴다. 희망가격에서 시장평균가를 넘는 구간이 붉게 표시된다
   * (시안 `1153:71594`).
   */
  dotClassName?: string;
};

export function Radio({ label, className, dotClassName, ...props }: RadioProps) {
  return (
    // 글자색을 바깥 label에 둔다. 안쪽 span에 박으면 호출부가 className으로 덮을 수 없다.
    <label
      className={cn(
        'text-content-primary flex items-center gap-2 has-[:disabled]:opacity-50',
        className,
      )}
    >
      <span className="relative flex size-5 shrink-0">
        <input
          className="peer border-border-disabled-secondary rounded-round focus-visible:ring-effect-focus-ring-primary size-5 appearance-none border-2 outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          type="radio"
          {...props}
        />
        {/* 안쪽 점. inset-1(4)이 테두리 2를 뺀 자리에 2 간격을 남겨 12짜리 점이 된다. */}
        <span
          aria-hidden
          className={cn(
            'rounded-round bg-surface-quinary pointer-events-none absolute inset-1 opacity-0 peer-checked:opacity-100',
            dotClassName,
          )}
        />
      </span>

      <span className="text-body-14">{label}</span>
    </label>
  );
}

interface RadioGroupProps {
  /** 그룹 이름. 같은 값을 가진 라디오끼리 하나만 선택된다. */
  name: string;
  /** 그룹이 무엇을 고르는지 알려 주는 요소의 id. 보통 섹션 제목이다. */
  labelledBy: string;
  children: ReactNode;
  className?: string;
}

/**
 * 라디오 묶음. 화면에 이미 제목이 있는 자리에 쓰므로 `fieldset`+`legend` 대신
 * `role="radiogroup"`으로 제목을 가리킨다. 제목을 두 번 읽히지 않게 하려는 것이다.
 *
 * `name`은 각 `Radio`에 직접 넘긴다. 여기서 자식을 복제해 주입하면 중간에 다른 요소를 끼울 수
 * 없게 된다(시안의 결제수단은 라디오 사이에 로고 줄이 들어간다).
 */
export function RadioGroup({ name, labelledBy, children, className }: RadioGroupProps) {
  return (
    <div
      aria-labelledby={labelledBy}
      className={cn('flex flex-col gap-5', className)}
      data-radio-group={name}
      role="radiogroup"
    >
      {children}
    </div>
  );
}
