import Image from 'next/image';
import Link from 'next/link';

import { GoBackButton } from '@/components/ui/GoBackButton';
import { DEMAND_GUIDE, DEMAND_GUIDE_STEPS } from '@/constants/demandGuide';

// 일정 타임라인 안내(FN-B09-05) 화면 본문. 시안 node 1153:71172("뭉치 진행 과정").
//
// 특정 수요 데이터를 그리지 않고 공구 진행 방식을 5단계 카드로 안내하는 정적 화면이다. 그래서
// API·mock 없이 constants/demandGuide.ts의 고정 카피만 렌더한다.
//
// 명세상 수요 접수·참여 직전에 거치는 화면이다. 진입점이 둘이고 [확인]이 가는 곳이 다르다.
//   B-08 [CTA]           → 이 화면 → [확인] → B-09 수요 등록   (`/products/[productId]/timeline`)
//   B-12 [함께 신청하기] → 이 화면 → [확인] → 퀵 참여          (`/demand-boards/[demandBoardId]/timeline`)
// 그래서 다음 화면 경로(`nextHref`)는 호출부 페이지가 정한다.
//
// `nextHref`를 넘기지 않으면 [확인]이 뒤로 가기로 동작한다(GoBackButton). 지금은 두 진입점 모두
// `nextHref`를 넘긴다. 예전 `/demands/[demandId]` 정적 화면은 B-12 수요 상세가 생기며 없앴다(#176).
//
// 단계 번호는 배열 순서(index+1)로 매긴다. 순서 있는 안내라 <ol>/<li>로 의미를 준다.

/**
 * 하단 [확인] 버튼 클래스. 검정 tertiary 버튼이다. hover·active·focus 상태 클래스는 다른 tertiary
 * CTA(StepFooter·LoginForm·ErrorScreen)의 인라인 컨벤션에 맞춘다(버튼 variant 규약이 생기면 그때
 * 공용화, ErrorScreen 주석 참조). 링크와 뒤로 가기 버튼이 같은 모양이어야 해서 한 곳에 둔다.
 */
const CONFIRM_BUTTON_CLASS =
  'bg-surface-button-tertiary-default hover:bg-surface-button-tertiary-hover active:bg-surface-button-tertiary-pressed text-content-inverse focus-visible:ring-effect-focus-ring-primary text-button-15 rounded-8 flex h-12 w-full items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

interface DemandGuideViewProps {
  /** [확인]이 이동할 다음 화면. 없으면 뒤로 가기로 화면을 닫는다. */
  nextHref?: string;
}

export function DemandGuideView({ nextHref }: DemandGuideViewProps) {
  return (
    <>
      <div className="flex flex-1 flex-col">
        <section className="flex flex-col gap-1 px-4 pt-4 pb-3">
          <h1 className="text-heading-24 text-content-primary">{DEMAND_GUIDE.title}</h1>
          <p className="text-body-14 text-content-tertiary">{DEMAND_GUIDE.subtitle}</p>
        </section>

        <ol className="flex flex-col gap-4 px-4">
          {DEMAND_GUIDE_STEPS.map((step, index) => (
            <li
              key={step.title}
              className="bg-surface-primary rounded-12 flex items-center gap-2 p-4"
            >
              <span className="relative size-12 shrink-0">
                <Image alt="" className="object-contain" fill sizes="48px" src={step.icon} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-title-17 text-content-primary">
                  {index + 1}. {step.title}
                </span>
                <span className="text-body-14 text-content-tertiary">{step.description}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* 하단 고정 CTA. `nextHref`가 있으면 다음 화면으로 넘어가고(BR-B09-05-01), 없으면 뒤로 가기로
          화면을 닫는다. 뒤로 가기일 때 첫 진입(공유 링크·새 탭)엔 돌아갈 히스토리가 없어 '확인'이
          죽지 않도록 홈으로 폴백한다.

          다음 화면으로 갈 때는 replace다. 이 화면은 시안에 뒤로 가기가 없어서, push로 쌓으면
          다음 화면의 뒤로 가기가 이 화면으로 돌아오고 여기서는 [확인]밖에 누를 게 없어 두 화면
          사이에 갇힌다(#138과 같은 모양). 거쳐 가는 화면이라 히스토리에서 빼면 다음 화면의
          뒤로 가기가 진입 화면(B-08)으로 바로 간다. */}
      <footer className="bg-background-default sticky bottom-0 w-full p-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
        {nextHref !== undefined ? (
          <Link className={CONFIRM_BUTTON_CLASS} href={nextHref} replace>
            {DEMAND_GUIDE.confirm}
          </Link>
        ) : (
          <GoBackButton className={CONFIRM_BUTTON_CLASS} fallbackHref="/">
            {DEMAND_GUIDE.confirm}
          </GoBackButton>
        )}
      </footer>
    </>
  );
}
