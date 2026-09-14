'use client';

import { ChevronDown } from 'lucide-react';
import Image from 'next/image';

import { Radio, RadioGroup } from '@/components/ui/Radio';
import { useToast } from '@/components/ui/Toast';
import { DEMAND_FORM_ASSETS } from '@/constants/assets';
import {
  DEMAND_EASY_PAY_PROVIDERS,
  DEMAND_FORM_MESSAGES,
  DEMAND_FORM_SECTIONS,
  DEMAND_PAYMENT_METHODS,
} from '@/constants/demandFormMessages';
import type {
  DemandEasyPayProviderKey,
  DemandPaymentMethodKey,
} from '@/constants/demandFormMessages';
import { DemandFormSection } from '@/features/demand/components/DemandFormSection';
import { cn } from '@/lib/cn';

// B-09 결제수단 섹션. 시안 `1153:71279` · `1153:71406`.
//
// **구현 범위가 시안 설명에 못박혀 있다.**
//   "결제수단 중 카드결제/계좌결제/휴대폰결제는 구현하지 않음"
//   "간편결제도 토스페이만 구현"
//   "네이버페이, 카카오페이는 디자인상으로만 존재"
//
// 그래서 넷 다 시안대로 그리되, 구현하지 않는 것을 누르면 선택되지 않고 '준비 중' 토스트가 뜬다.
// `disabled`로 흐리게 만들지 않은 이유는 시안에 흐린 상태가 없어서다. 기능정의서 머리말의
// "미구현 기능 진입점은 노출하되 탭 시 토스트" 규칙과 `ComingSoonButton`이 같은 방침이다.
//
// 실측(픽셀 직접 샘플): 배너 333x46 radius 8 surface-secondary · 사업자 칸 107x52 radius 4 ·
// 칸 사이 4 · 선택된 칸 테두리 #434343, 나머지 #d6d6d6 · 행 간격 16 · 라디오와 칸 사이 8.
//
// ⚠️ 시안 컴포넌트 안에 `혜택` 배지가 있지만 실제 프레임에는 그려지지 않는다. 배지 프레임
//    (`1153:71308`)의 x가 130인데 부모 박스 폭이 107이라 잘려 나간다. 보이지 않는 것을 임의로
//    살리지 않았다.

/**
 * 시안: 사업자 한 칸. 선택 여부로 테두리만 갈린다. 로고 색은 그대로 둔다.
 *
 * 바탕과 테두리를 **모드 무관 primitive로 고정한다.** 로고가 검정 글자를 구운 브랜드 이미지라
 * CSS로 색을 못 바꾸는데, 다크에서 어두운 카드 위에 놓으면 토스 글자와 카카오 로고가 배경에
 * 묻혀 사라진다(네이버만 초록이라 살아남는다).
 *
 * 라이트에서 카드 바탕 `background-default`가 #ffffff이므로 흰 판은 **라이트에서 시안과 똑같고**
 * 다크에서만 흰 판이 된다. 브랜드 마크를 흰 판에 얹는 것은 이 저장소에 이미 있는 방식이다
 * (구글 로그인 버튼도 같은 이유로 `bg-white` 고정, `SocialLoginButtons`).
 *
 * 테두리도 primitive로 못박는다. 시맨틱 토큰이 다크에서 뒤집혀 미선택 `border-quarternary`가
 * #434343, 선택 `border-secondary`가 #d6d6d6가 되어 선택 관계가 거꾸로 읽힌다. 시안의 라이트
 * 값을 쓴다. 미선택 #d6d6d6(`coolgray-300`) · 선택 #434343(`coolgray-700`).
 *
 * ⚠️ **선택 표시는 테두리가 아니라 안쪽 선(`inset-ring`)이다.** 시안은 테두리 색만 바꾸는데
 *    (미선택 `border-default` → 선택 `border-strong`) 그 방식은 다크에서 보이지 않는다.
 *    테두리는 요소의 바깥 경계에 그려져 어두운 카드(#1a1a1a)와 맞닿는다. 어두운 테두리가 어두운
 *    배경에 섞여, 흰 판이 1픽셀 작아진 것으로만 보인다. 라이트에서는 카드가 흰색이라 같은 선이
 *    뚜렷해서 시안에서는 문제가 드러나지 않는다.
 *
 *    그래서 바깥 테두리는 미선택 색으로 고정해 판의 윤곽만 잡고, 선택 표시를 판 안쪽에 그린다.
 *    양옆이 #d6d6d6와 흰색이라 뒤쪽 배경과 무관하게 보인다. 시안보다 선이 굵어지는 것이 유일한
 *    차이다. 다크용 시안을 받으면 그쪽에 맞춘다.
 */
const PROVIDER_CLASS =
  'border-coolgray-300 active:bg-coolgray-100 flex h-13 flex-1 items-center justify-center rounded-4 border bg-white';

/**
 * 사업자 로고와 그 표시 크기(시안 실측).
 *
 * 박스는 셋 다 107x52로 같은데 로고 크기는 다르다. 가운데 정렬이라 위치는 따로 주지 않는다.
 * 소수점(77.2 · 16.78)은 정수로 반올림했다. 1픽셀 미만이라 눈에 보이지 않는다.
 */
const PROVIDER_LOGOS: Record<
  DemandEasyPayProviderKey,
  { src: string; width: number; height: number }
> = {
  toss: { src: DEMAND_FORM_ASSETS.tossPayLogo, width: 77, height: 14 },
  naver: { src: DEMAND_FORM_ASSETS.naverPayLogo, width: 49, height: 17 },
  kakao: { src: DEMAND_FORM_ASSETS.kakaoPayLogo, width: 47, height: 18 },
};

interface PaymentMethodSectionProps {
  paymentMethod: DemandPaymentMethodKey | null;
  easyPayProvider: DemandEasyPayProviderKey | null;
  onPaymentMethodChange: (method: DemandPaymentMethodKey) => void;
  onEasyPayProviderChange: (provider: DemandEasyPayProviderKey) => void;
}

export function PaymentMethodSection({
  paymentMethod,
  easyPayProvider,
  onPaymentMethodChange,
  onEasyPayProviderChange,
}: PaymentMethodSectionProps) {
  const { showComingSoon } = useToast();

  return (
    <DemandFormSection
      note={DEMAND_FORM_MESSAGES.autoPaymentNote}
      title={DEMAND_FORM_SECTIONS.payment.title}
      titleId={DEMAND_FORM_SECTIONS.payment.id}
    >
      <div className="flex w-full flex-col gap-4">
        {/* 토스 프로모션 배너. 문구가 시안에 박혀 있지만 토스 연동 시 서버가 내려줄 수 있다. */}
        <div className="bg-surface-secondary rounded-8 flex h-11.5 w-full items-center justify-between gap-2 px-4">
          <p className="text-caption-12 text-content-primary min-w-0 truncate">
            {DEMAND_FORM_MESSAGES.tossPromotion}
          </p>
          <ChevronDown className="text-content-quarternary size-4 shrink-0" />
        </div>

        <RadioGroup
          className="gap-4"
          labelledBy={DEMAND_FORM_SECTIONS.payment.id}
          name="demand-payment-method"
        >
          {DEMAND_PAYMENT_METHODS.map((method) => (
            <div className="flex w-full flex-col gap-2" key={method.key}>
              <Radio
                // 사업자 칸과 같은 이유다. 카드·계좌·휴대폰은 눌러도 선택되지 않는다.
                aria-disabled={!method.implemented}
                checked={paymentMethod === method.key}
                label={method.label}
                name="demand-payment-method"
                onChange={() => {
                  if (!method.implemented) {
                    showComingSoon();
                    return;
                  }
                  onPaymentMethodChange(method.key);
                }}
                value={method.key}
              />

              {/* 간편결제 아래에만 사업자 3칸이 붙는다. */}
              {method.key === 'easy' && (
                <div className="flex w-full items-center gap-1">
                  {DEMAND_EASY_PAY_PROVIDERS.map((provider) => {
                    const logo = PROVIDER_LOGOS[provider.key];

                    return (
                      <button
                        // 값 하나만 고르는 버튼 그룹이라 `aria-pressed`로 선택 상태를 알린다
                        // (`SegmentControl`과 같은 방침). 테두리만 바뀌면 보조기술에는 아무
                        // 변화가 없어 고른 뒤에도 평범한 버튼으로 읽힌다.
                        aria-pressed={easyPayProvider === provider.key}
                        // 미구현 사업자는 눌러도 선택되지 않는다. 시안에 흐린 상태가 없어 겉모습은
                        // 그대로 두지만, 고를 수 없다는 사실은 알려야 한다(`SearchView`와 같은
                        // 방침). `disabled`가 아니라 `aria-disabled`인 이유는 포커스와 클릭을
                        // 살려 '준비 중' 토스트를 띄워야 하기 때문이다.
                        aria-disabled={!provider.implemented}
                        className={cn(
                          PROVIDER_CLASS,
                          easyPayProvider === provider.key &&
                            'inset-ring-coolgray-700 inset-ring-2',
                        )}
                        key={provider.key}
                        onClick={() => {
                          if (!provider.implemented) {
                            showComingSoon();
                            return;
                          }
                          onEasyPayProviderChange(provider.key);
                        }}
                        type="button"
                      >
                        {/* 로고에 사업자 이름이 다 들어 있지 않다(카카오는 `pay`만). 버튼의
                            읽히는 이름이 alt에서 나오므로 이름을 넣는다. */}
                        <Image
                          alt={provider.label}
                          height={logo.height}
                          src={logo.src}
                          width={logo.width}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </RadioGroup>
      </div>
    </DemandFormSection>
  );
}
