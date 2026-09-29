import clsx from 'clsx';
import type { ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// 디자인 시스템 타이포 토큰(`text-body-14`·`text-button-15`·`text-heading-20` 등)은 크기·행간·굵기를
// 묶은 **폰트 크기** 유틸리티다(globals.css `@theme`의 `--text-*`). 하지만 기본 tailwind-merge는 이
// 커스텀 이름을 색상(`text-content-*`)과 같은 `text-` 그룹으로 오인한다. 그래서 cn()에서 크기 토큰과
// 조건부 색을 함께 넘기면(예: 버튼의 `text-button-15` + 상태별 `text-content-inverse`) 크기 토큰이
// 병합에서 지워져 폰트가 기본값으로 되돌아간다. 타이포 토큰을 font-size 그룹으로 등록해, 색과 충돌하지
// 않고(크기끼리·색끼리만 충돌) 공존하게 한다.
const isTypographyToken = (value: string) =>
  /^(body|button|caption|heading|label|section-title|title)-\d+$/.test(value);

//
// 모서리 토큰(`rounded-8`·`rounded-round` 등, globals.css `--radius-*`)도 같은 문제가 있다. 기본
// tailwind-merge는 숫자·`round` 이름을 모서리 값으로 알아보지 못해 둘 다 남기고, 그러면 CSS 생성 순서상
// 뒤에 오는 `rounded-round`가 이긴다. `Button`(기본 `rounded-round`)에 `rounded-8`을 넘긴 하단 CTA가
// 알약 모양으로 나온 원인이다(디자인 QA 9/28 'CTA radius 오류'). 토큰 이름을 radius 테마로 등록한다.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ['4', '8', '12', '16', '20', '24', '28', '32', 'round'],
    },
    classGroups: {
      'font-size': [{ text: [isTypographyToken] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
