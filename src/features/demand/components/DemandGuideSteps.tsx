import Image from 'next/image';

import { DEMAND_GUIDE_STEPS } from '@/constants/demandGuide';
import { cn } from '@/lib/cn';

// '뭉치 진행 과정' 단계 목록. 시안 node 1153:71172의 5단계 카드다.
//
// 명세의 '일정 타임라인(B-09와 동일 컴포넌트): 마감 → 낙찰 판정 → 48시간 확인 → 결제'가 이 목록이다.
// 두 곳이 같이 쓴다.
//   진행 과정 안내(`DemandGuideView`): 수요 등록(B-09) 직전에 거치는 화면
//   수요 상세(`DemandBoardDetailView`): 상세 정보 아래(MC-B12-01 구성 요소)
//
// 단계 카드는 회색(surface-primary)이라 흰 배경 위에 둔다. 단계 번호는 배열 순서(index+1)로
// 매기고, 순서 있는 안내라 <ol>/<li>로 의미를 준다.

interface DemandGuideStepsProps {
  /** 목록 바깥 여백 등. 안내 화면은 좌우 여백을 여기로 준다. */
  className?: string;
}

export function DemandGuideSteps({ className }: DemandGuideStepsProps) {
  return (
    <ol className={cn('flex flex-col gap-4', className)}>
      {DEMAND_GUIDE_STEPS.map((step, index) => (
        <li key={step.title} className="bg-surface-primary rounded-12 flex items-center gap-2 p-4">
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
  );
}
