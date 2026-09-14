# 디자인 토큰

`src/app/globals.css`는 **손으로 쓰지 않습니다.** 이 폴더의 JSON에서 생성합니다.

```bash
node design/tokens/build-tokens.mjs
npm run format
```

## 정본은 이 폴더의 JSON입니다

2026-08-21 프로덕트 디자인 강사님 피드백을 반영하여 **프론트엔드팀은 Figma View 권한**이 되었습니다. Edit 권한은 디자인팀이 관리하고, 토큰은 **Variables JSON으로 전달**받습니다.

따라서 값의 정본은 Figma가 아니라 `design/tokens/raw/`의 JSON입니다. 새 JSON을 받으면 해당 파일을 교체하고 생성기를 다시 돌립니다. **어느 시점 토큰인지 추적하려고 원본을 커밋합니다.**

| 수령일     | 내용                                                            |
| ---------- | --------------------------------------------------------------- |
| 2026-08-21 | 최초 수령. 컬렉션 5개(`03-component`는 아직 변수 없음)          |
| 2026-09-14 | `03-component`(badge/surface 13종) 최초 수령. 단일 모드(Mode 1) |

## 컬렉션

| 폴더                  | 모드              |           개수 | 용도                                     |
| --------------------- | ----------------- | -------------: | ---------------------------------------- |
| `01-color-primitives` | 단일              | 132 + 알파 108 | 색 램프 11종                             |
| `02-color-semantic`   | **light / dark**  |             60 | 화면에서 실제로 쓰는 색                  |
| `03-component`        | **단일 (Mode 1)** |             13 | badge 표면색. 모드에 안 갈리는 고정 틴트 |
| `04-number`           | 단일              |             53 | margin · gap · radius · height · border  |
| `05-typography`       | 단일              |             68 | font-size · line-height · font-weight    |
| `06-responsive`       | 단일              |              1 | 모바일 기준 폭 393                       |

`03-component`(badge 표면색)는 모드에 안 갈리는 고정 틴트라 단일 모드(Mode 1) 파일로 받습니다. 생성기가 접두 번호로 폴더를 찾아, semantic 같은 모드 전환 층이 아니라 primitive처럼 mode-agnostic `@theme` 층에 출력합니다. 값은 대부분 primitive의 알파 변형(A20) 별칭입니다.

## 이름을 두 층으로 나눕니다

모드가 갈리는 토큰은 **1층과 2층의 이름이 달라야** 합니다.

```css
/* 1층: 모드에 따라 값이 바뀐다 */
:root {
  --content-primary: #0a0a0a;
}
[data-theme='dark'] {
  --content-primary: #ffffff;
}

/* 2층: Tailwind 배선. inline이라 유틸리티가 var()를 참조한다 */
@theme inline {
  --color-content-primary: var(--content-primary);
}
```

한 층으로 합쳐서 `@theme inline`과 `.dark`가 **같은 이름**을 쓰면, 유틸리티에 라이트 값이 그대로 박혀 다크모드가 동작하지 않습니다. 실제로 컴파일해 확인한 사실이므로 구조를 바꾸지 마세요.

## 변환 규칙

| Figma                          | CSS                                    | 사용                                                  |
| ------------------------------ | -------------------------------------- | ----------------------------------------------------- |
| `brand/400-p`                  | `--color-brand-400`                    | `bg-brand-400`. `-p`는 primary 표시일 뿐이라 벗깁니다 |
| `opacity/brand/400-A20`        | `--color-brand-a20`                    | `bg-brand-a20`                                        |
| `content/primary`              | `--color-content-primary`              | `text-content-primary`                                |
| `surface/button/primary/hover` | `--color-surface-button-primary-hover` | `bg-surface-button-primary-hover`                     |
| `radius/radius-12`             | `--radius-12`                          | `rounded-12`                                          |
| `radius/round`                 | `--radius-round`                       | `rounded-round`                                       |
| `font/heading/Heading-24`      | `--text-heading-24`                    | `text-heading-24` (크기 · 행간 · 굵기가 함께 적용)    |
| `responsive-size`              | `--container-mobile`                   | `max-w-mobile`                                        |

### spacing은 Tailwind 기본을 그대로 씁니다

`number-reference-value`가 전부 4의 배수라 Tailwind 기본 `--spacing`(4px)과 정확히 맞습니다.

| 디자인                | Tailwind |
| --------------------- | -------- |
| `gap/gap-16`          | `gap-4`  |
| `height/height-44`    | `h-11`   |
| `margin/default` (16) | `p-4`    |
| `border/border-1`     | `border` |

`--spacing-*`을 새로 만들지 않는 이유는, 기본 스케일을 덮으면 `p-16`을 64px로 오해하기 때문입니다.

## 디자인팀에 확인 중인 것

| 항목               | 내용                                                                                                                                                                  |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| red 알파 기준색    | `red/400-p`는 `#ff2569`인데 `opacity/red/400-A*`의 기준은 `#ff1860`입니다. 다른 램프는 전부 일치합니다. 그래서 `surface/error`와 `content/error`의 색 계열이 다릅니다 |
| green 600          | green 램프만 600 단계가 없습니다                                                                                                                                      |
| 타이포 변수명      | `font/title/title - 18`에 공백, `font/heading/Heading-24`만 대문자, `font/caption/caption-12`가 `font-size/label/label-12`를 참조합니다                               |
| 다크모드 전환 방식 | 토글인지 기기 설정인지 미확정이라 생성기가 **둘 다** 지원합니다                                                                                                       |

이름 관련 지적은 Figma에서 고치는 것으로 요청했습니다. 생성기에서 보정하면 JSON을 받을 때마다 보정해야 합니다.
