import { cn } from '@/lib/cn';
import type { PaymentMethod } from '@/types/payment';

// 결제수단 목록(B-14)의 카드 한 장. 카드 썸네일 + 카드사명 + 마스킹 번호로 구성한다.
// B-09 결제수단 섹션도 이번 수요에 쓸 결제수단을 이 카드의 조회 모드로 보여 준다.
//
// 두 모드를 판별 유니온으로 나눈다(FN-B14-01 BR-12).
//   · 'view'   조회 모드 — 기본 카드에 '기본' 뱃지. onActivate가 있으면 행 탭으로 기본변경 모드에
//              진입한다. 바꿀 대상이 없으면 onActivate를 넘기지 않아 탭에 반응하지 않는다(BR-16).
//   · 'select' 기본변경 모드 — 좌측 라디오(단일 선택). 뱃지 대신 라디오가 상태를 표시한다.
//
// 시안 카드 표면: 강조 카드(조회 모드의 기본 카드 / 기본변경 모드의 선택 카드)는 흰 배경 + 진한
// 테두리, 나머지는 회색(surface/secondary) 채움에 테두리 없음. 테두리 두께차로 크기가 튀지 않게
// 비강조 카드도 투명 테두리를 둔다.
//
// 선택할 수 없는 결제수단(백엔드 `INACTIVE`)은 목록에 보이되 라디오를 잠그고 글자를 흐리게 한다
// (백엔드 가이드 6.4). 시안에 없는 상태라 상태 문구는 붙이지 않았다.

type PaymentMethodCardProps =
  | { method: PaymentMethod; variant: 'view'; onActivate?: () => void }
  | {
      method: PaymentMethod;
      variant: 'select';
      selected: boolean;
      onSelect: () => void;
      /** 기본 변경 요청 중. 명세 화면상태 '변경 요청 중: 라디오 잠금'. */
      locked?: boolean;
    };

const CARD_BASE = 'rounded-12 flex w-full items-center gap-3 px-4 py-3.5';

function surfaceClass(emphasized: boolean) {
  return emphasized
    ? 'bg-background-default border-content-primary border'
    : 'bg-surface-secondary border border-transparent';
}

function CardBody({ method }: { method: PaymentMethod }) {
  return (
    <>
      {/* 카드사 이미지 자리. 백엔드 목록이 카드사 이미지를 주지 않아 자리만 둔다. */}
      <span aria-hidden className="bg-surface-tertiary h-[38px] w-[30px] shrink-0 rounded-[4px]" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
        <span
          className={cn(
            'text-label-16 truncate',
            method.isSelectable ? 'text-content-primary' : 'text-content-disabled-primary',
          )}
        >
          {method.name}
        </span>
        {/* 토스가 마스킹한 번호를 그대로 쓴다. 형식이 고정돼 있지 않아 가공하지 않는다. */}
        {method.maskedNumber !== null && (
          <span
            className={cn(
              'text-body-14 truncate',
              method.isSelectable ? 'text-content-tertiary' : 'text-content-disabled-primary',
            )}
          >
            {method.maskedNumber}
          </span>
        )}
      </span>
    </>
  );
}

export function PaymentMethodCard(props: PaymentMethodCardProps) {
  const { method } = props;

  if (props.variant === 'select') {
    const { selected, onSelect, locked = false } = props;
    return (
      <li className="w-full">
        <button
          aria-checked={selected}
          className={cn(
            CARD_BASE,
            surfaceClass(selected),
            'enabled:active:bg-surface-tertiary disabled:cursor-not-allowed',
          )}
          disabled={!method.isSelectable || locked}
          onClick={onSelect}
          role="radio"
          type="button"
        >
          <span
            aria-hidden
            className={cn(
              'flex size-5 shrink-0 items-center justify-center rounded-full border',
              selected ? 'border-content-primary' : 'border-border-tertiary',
            )}
          >
            {selected && <span className="bg-content-primary size-2.5 rounded-full" />}
          </span>
          <CardBody method={method} />
        </button>
      </li>
    );
  }

  const { onActivate } = props;

  // 조회 모드. 바꿀 대상이 있으면 행 탭으로 기본변경 모드에 진입한다(onActivate가 있을 때만 버튼으로).
  if (onActivate === undefined) {
    return (
      <li className={cn(CARD_BASE, surfaceClass(method.isDefault))}>
        <CardBody method={method} />
        {method.isDefault && <DefaultBadge />}
      </li>
    );
  }

  return (
    <li className="w-full">
      <button
        className={cn(CARD_BASE, surfaceClass(method.isDefault), 'active:bg-surface-tertiary')}
        onClick={onActivate}
        type="button"
      >
        <CardBody method={method} />
        {method.isDefault && <DefaultBadge />}
      </button>
    </li>
  );
}

// 기본결제수단 표시. 시안은 검정 채운 pill + 흰 글씨.
function DefaultBadge() {
  return (
    <span className="bg-surface-button-tertiary-default text-content-inverse text-label-14 shrink-0 rounded-full px-3.5 py-1.5">
      기본
    </span>
  );
}
