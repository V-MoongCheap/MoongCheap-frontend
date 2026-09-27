import { DEMAND_GUIDE_ASSETS } from '@/constants/assets';
import type { DemandGuideStep } from '@/types/demand';

/**
 * '뭉치 진행 과정' 안내 화면의 고정 카피와 단계 목록. Figma node 981:15479.
 *
 * 이 화면은 특정 수요 데이터를 그리지 않고 공구 진행 방식을 안내하는 정적 화면이라, 문구를 여기
 * 한곳에 모은다(다른 화면의 *Messages.ts와 같은 방침). 수요 등록(B-09)과 퀵 참여(B-12) 직전에
 * 거치고, 하단 '확인'으로 다음 화면에 간다(`DemandGuideView`). 단계 타입은 [[types/demand]]에 있다.
 */
export const DEMAND_GUIDE = {
  title: '뭉치 진행 과정',
  subtitle: '뭉치의 공구는 아래와 같은 방법으로 진행됩니다.',
  confirm: '확인',
} as const;

/** 시안 순서 그대로의 5단계. 순서가 곧 번호이므로 재배열에 주의. */
export const DEMAND_GUIDE_STEPS = [
  {
    icon: DEMAND_GUIDE_ASSETS.request,
    title: '수요신청',
    description: '내가 원하는 상품을 신청하거나 참여해요.',
  },
  {
    icon: DEMAND_GUIDE_ASSETS.close,
    title: '마감',
    description: '공구 참여가 마감돼요',
  },
  {
    icon: DEMAND_GUIDE_ASSETS.award,
    title: '낙찰 판정',
    description: '판매자들끼리 경쟁을 통해 최종 판매자가 결정돼요',
  },
  {
    icon: DEMAND_GUIDE_ASSETS.confirm,
    title: '48시간 확인',
    description: '낙찰 상품을 확인하고 상품을 취소할 수 있어요',
  },
  {
    icon: DEMAND_GUIDE_ASSETS.payment,
    title: '결제',
    description: '상품 확정 후 취소하지 않으면 자동 결제돼요',
  },
] as const satisfies readonly DemandGuideStep[];
