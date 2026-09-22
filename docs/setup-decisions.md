# 설정 근거 (setup decisions)

이 저장소의 도구 설정은 초기 세팅 단계에서 한 번에 들여왔습니다.
**"원래 그렇게 쓰던 것"은 기술 선택 근거가 아니므로**, 각 설정이 무엇을 하고 왜 필요한지를 여기에 남깁니다.

근거가 불명확한 항목은 그럴듯한 이유를 지어내지 않고 **`⚠️ 근거 불명확 — 팀 확인 필요`**로 표시했습니다.

지금 도입하지 **않은** 것들과 그 이유는 [`deferred-setup.md`](./deferred-setup.md)에 있습니다.

---

## 1. Prettier — `.prettierrc`, `.prettierignore`

**하는 일** — 코드 포맷을 자동으로 통일한다.

**필요한 이유** — 프론트 2인 협업. 포맷 차이로 생기는 diff 노이즈를 없애야 PR에서 실제 변경만 보인다. `format:check`가 CI에 걸려 있어 포맷이 어긋난 코드는 머지되지 않는다.

**Prettier 기본값과 다른 항목**

| 옵션                                   | 값     | 기본값  | 의미                                                              |
| -------------------------------------- | ------ | ------- | ----------------------------------------------------------------- |
| `singleQuote`                          | `true` | `false` | 문자열에 작은따옴표. JSX 속성은 Prettier가 알아서 큰따옴표를 유지 |
| `printWidth`                           | `100`  | `80`    | 한 줄 100자. 80자는 Tailwind 클래스가 붙는 JSX에서 지나치게 잘림  |
| `plugins: prettier-plugin-tailwindcss` | 사용   | 없음    | Tailwind 클래스를 공식 권장 순서로 자동 정렬                      |

`semi: true`, `trailingComma: "all"`, `tabWidth: 2`, `endOfLine: "lf"`는 Prettier 3 기본값과 같습니다. 명시적으로 적어 둔 것뿐입니다.

**`.prettierignore`** — `public/`(정적 에셋), lock 파일, 빌드 산출물을 포맷 검사에서 제외합니다.

---

## 2. ESLint — `eslint.config.mjs`

**하는 일** — 코드 스타일과 잠재적 버그를 정적 분석으로 잡는다.

**필요한 이유** — `eslint-config-next`의 `core-web-vitals`가 Next.js 특유의 실수(`<img>` 남용, `next/link` 미사용 등)를 잡아 준다. CI에서 `npm run lint`가 돌아 위반 시 머지가 막힌다.

### 기본값이 아닌 커스텀 룰

#### `import/order` — ✅ 근거 명확

```
builtin → external(react 최우선) → internal(@/) → parent/sibling
그룹 간 빈 줄 필수, 그룹 내 알파벳 오름차순(대소문자 무시)
```

- **막는 것**: import 순서가 파일마다 제각각인 상태.
- **판단 근거**: `eslint-config-next`에는 `import/order`가 **없다**(확인함). 순수하게 팀이 추가한 룰이다. import 순서는 기능에 영향이 없으면서 diff에는 그대로 드러나므로, 규칙 없이 두면 PR마다 순서가 뒤바뀌어 리뷰 노이즈가 된다. `--fix`로 자동 교정되므로 개발자가 신경 쓸 필요도 없다.
- 동작하려면 `eslint-plugin-import` + `eslint-import-resolver-typescript`가 필요하다. resolver가 있어야 `@/` 별칭을 `internal` 그룹으로 인식한다.

#### `@typescript-eslint/no-explicit-any: 'error'` — ⚠️ 중복 설정

- **막는 것**: `any` 타입 사용.
- **확인 결과**: 이 룰은 **`eslint-config-next/typescript`에 이미 `'error'`로 켜져 있다** (`typescript-eslint/recommended` 경유). 즉 이 줄은 동작을 바꾸지 않는 **중복 선언**이다.
- **판단**: 의도를 문서처럼 드러내려는 목적이면 남겨도 무해하다. 다만 "우리가 추가한 룰"로 발표에 쓰기엔 부정확하다. 제거해도 동작은 동일하다.
- ⚠️ **팀 확인 필요** — 명시성을 위해 남길지, 중복이므로 지울지.

#### `import/no-default-export: 'error'` (+ 예외 목록) — ✅ 근거 명확, 단 취향 영역

- **막는 것**: `export default`.
- **왜 켜는가**: named export는 import 쪽에서 이름을 마음대로 바꿀 수 없어 같은 심볼이 항상 같은 이름으로 불린다. IDE 자동 import·rename·전역 검색이 정확해진다.
- **예외 처리**: Next.js App Router 예약 파일(`page.tsx`, `layout.tsx`, `error.tsx`, `loading.tsx`, `not-found.tsx`, `template.tsx`, `route.ts`, `manifest.ts`)과 설정 파일(`next.config.ts`, `postcss.config.mjs`, `tailwind.config.ts`, `eslint.config.mjs`, `commitlint.config.mjs`)은 프레임워크·툴이 default export를 요구하므로 룰을 끈다.
- ⚠️ **예외 목록의 `route.ts`는 확인 필요** — Route Handler는 `GET`/`POST` 같은 named export를 쓰므로 default export 예외가 필요 없다. 목록에 들어간 근거가 불명확하다. 어차피 이 저장소는 Route Handler를 두지 않을 예정이라 실질 영향은 없다.
- ⚠️ **`tailwind.config.ts`도 확인 필요** — Tailwind v4는 CSS-first 설정(`@theme`)을 쓰고 이 저장소에 `tailwind.config.ts`가 없다. 남아 있어도 무해한 죽은 항목이다.

#### `globalIgnores([..., 'public/**'])` — ✅ 근거 명확

- `eslint-config-next` 기본 무시 목록(`.next/**`, `out/**`, `build/**`, `next-env.d.ts`)을 덮어쓰면서 `public/**`을 추가한다.
- **왜**: `public/`은 정적 에셋 디렉토리다. 여기 들어가는 서드파티 JS 등을 린트할 이유가 없다. `.prettierignore`가 `public`을 제외하는 것과 같은 정책이다.
- 주의: `globalIgnores`를 쓰는 순간 기본 목록이 대체되므로, 기본 4개를 **다시 나열해야 한다**. 그래서 목록이 길어 보이는 것이지 전부 커스텀은 아니다.

---

## 3. TypeScript — `tsconfig.json`

**하는 일** — 타입 검사 규칙과 경로 별칭을 정의한다.

**필요한 이유** — `strict: true`로 null/undefined 처리 누락을 컴파일 타임에 잡는다. `paths: { "@/*": ["./src/*"] }` 별칭으로 `../../../` 상대 경로 지옥을 피한다.

**특기 사항** — 이 파일은 `create-next-app`이 생성한 것과 **내용이 완전히 동일**하다. 우리가 손댄 부분이 없으므로 발표에서 "우리가 정한 설정"으로 세지 않는 편이 정확하다.

`typecheck` 스크립트는 `tsc --noEmit --pretty false`다. `--pretty false`는 CI 로그에서 ANSI 색상 코드를 빼 로그를 읽기 쉽게 한다.

---

## 4. Git hooks — `.husky/`

**하는 일** — 커밋 시점에 검사를 자동 실행한다.

**필요한 이유** — CI에서 걸릴 문제를 로컬에서 먼저 잡는다. CI 한 바퀴가 몇 분인데, 세미콜론 하나로 그걸 태우면 낭비다.

| hook         | 내용                                    | 하는 일                                                    |
| ------------ | --------------------------------------- | ---------------------------------------------------------- |
| `commit-msg` | `npx --no -- commitlint --edit $1`      | 커밋 메시지가 컨벤션에 맞는지 검사                         |
| `pre-commit` | `npx lint-staged` → `npm run typecheck` | 스테이징된 파일만 lint+format 자동 수정 후, 전체 타입 검사 |

**`lint-staged` 설정은 `package.json`에 있다** (`.husky/`가 아님). 스테이징된 파일만 대상으로 하므로 저장소 전체를 린트하는 것보다 훨씬 빠르다.

`pre-commit`의 `npm run typecheck`는 **스테이징 여부와 무관하게 전체를 검사**한다. 타입 오류는 파일 하나만 봐서는 알 수 없기 때문이다. 대신 저장소가 커지면 커밋이 느려질 수 있다.

**(2026-08-14 결정) pre-commit 유지.** 지금은 코드가 거의 없어 커밋이 빠르다. 저장소가 커져 커밋이 느려지는 시점에 pre-push로 옮기는 것을 재검토한다.

---

## 5. Commitlint — `commitlint.config.mjs`

**하는 일** — 커밋 메시지 형식을 강제한다. `@commitlint/config-conventional`(Conventional Commits) 기반.

**필요한 이유** — 커밋 로그가 일정한 형식이면 변경 이력을 훑는 비용이 줄고, 발표 자료용으로 작업 내역을 뽑기도 쉽다.

### 허용 타입 (`type-enum`)

`config-conventional` 기본값과 **다르다.** 기본값은 `build, chore, ci, docs, feat, fix, perf, refactor, revert, style, test`다.

| 타입       | 의미                                                         | 기본값 대비 |
| ---------- | ------------------------------------------------------------ | ----------- |
| `feat`     | 신규 기능 개발 및 업데이트                                   | 동일        |
| `fix`      | 일반적인 버그 수정                                           | 동일        |
| `hotfix`   | 운영 환경에서 발생한 긴급 장애 대응                          | **추가**    |
| `style`    | 코드 formatting, 세미콜론 누락 등 코드 자체 변경이 없는 경우 | 동일        |
| `refactor` | 기능 변화 없는 코드 구조 및 로직 개선                        | 동일        |
| `chore`    | 빌드 설정, 의존성 관리, 패키지 설치 등                       | 동일        |
| `docs`     | 프로젝트 문서 작성 및 수정                                   | 동일        |
| `init`     | 프로젝트 초기 세팅                                           | **추가**    |
| —          | `build`, `ci`, `perf`, `revert`, `test`                      | **제거됨**  |

- **`init` 추가**: 초기 세팅 커밋을 `chore`에 섞지 않고 분리해 이력에서 구분하려는 의도로 보인다. 프로젝트 초반에만 쓰인다.
- **`hotfix` 추가**: `fix`와 구분해 긴급 대응을 이력에서 눈에 띄게 하려는 의도.
- **`ci` 추가 (2026-08-14 결정)**: GitHub Actions 워크플로 수정 커밋을 `chore`로 우회하던 문제를 해소하기 위해 `ci`를 `type-enum`에 되살렸다.
- **`test`는 이번엔 미추가 (2026-08-14 결정)**: `src/tests/` 폴더는 있으나 아직 테스트 도입 계획이 구체화되지 않아 보류. 테스트 코드를 쓰기 시작하는 시점에 `test`를 추가한다.
- `build`, `perf`, `revert`는 당장 쓸 일이 없어 그대로 제외 유지.

### 나머지 룰

| 룰                  | 값                   | 판단                                                                                                                                 |
| ------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `subject-empty`     | `[2, 'never']`       | ⚠️ **`config-conventional` 기본값과 동일 (중복 선언).** 동작에 영향 없음                                                             |
| `type-empty`        | `[2, 'never']`       | ⚠️ **기본값과 동일 (중복 선언).** 동작에 영향 없음                                                                                   |
| `header-max-length` | `[2, 'always', 120]` | ✅ 기본값 100 → 120으로 완화. 커밋 컨벤션이 `유형: 상세설명 (#이슈번호)`라 이슈 번호 자리를 감안한 것. 파일에 주석으로도 명시돼 있음 |

### ⚠️ 상속되는 `subject-case` — 실제로 걸린다

`config-conventional`의 `subject-case`가 그대로 상속됩니다. 값은 `[2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']]`입니다.

한글 제목은 대소문자 개념이 없어 대체로 통과하지만, **제목이 영문 대문자로 시작하면 막힙니다.**

```
✗ refactor: SafeShot 프로토타입 제거하고 빈 랜딩 페이지로 교체
  → subject must not be sentence-case, start-case, pascal-case, upper-case

✓ refactor: 아이디어톤 프로토타입 제거하고 빈 랜딩 페이지로 교체
```

이 저장소는 SafeShot에서 리네임한 프로젝트라 초기 세팅 커밋에서 실제로 걸렸습니다.

**(2026-08-14 결정) `subject-case`를 `[0]`으로 껐습니다.** 제품명(`MoongCheap`)·컴포넌트명 등 영문 고유명사를 제목 맨 앞에 쓸 일이 잦아, 룰을 비활성화해 제약을 없앴습니다. 이제 `feat: MoongCheap 로고 적용` 같은 제목도 통과합니다.

---

## 6. `.gitignore`

**하는 일** — 추적하지 않을 파일을 지정한다.

**필요한 이유** — `.env*`를 차단해 **비밀키가 커밋되는 사고를 구조적으로 막는다.** 이게 가장 큰 이유다. 나머지(빌드 산출물, 캐시, OS 파일)는 저장소를 깨끗이 유지하는 용도다.

**항목별 판단**

- `!.env.local.example` 예외 — 소셜 로그인(#18)에서 `NEXT_PUBLIC_API_BASE_URL` 견본을 추가하며 되살림. `.env*` 전체 차단 중 견본만 예외로 추적
- `.claude/settings.local.json`, `.claude/launch.json`, `CLAUDE.local.md`, `.codex/` — 개발자 개인 설정은 저장소에 올리지 않음
- `checklist.md`, `context-notes.md` — AI 에이전트가 만드는 작업 메모

`.claude/launch.json`은 이 저장소에서 **이미 추적 중이었으나** 새 `.gitignore` 정책에 맞춰 추적에서 제외했습니다(`git rm --cached`). 파일 자체는 로컬에 남아 있습니다.

---

## 7. GitHub 템플릿 — `.github/ISSUE_TEMPLATE/`, `.github/pull_request_template.md`

**하는 일** — 이슈·PR 작성 시 채워야 할 항목을 미리 띄운다.

**필요한 이유** — 브랜치 이름에 이슈 번호가 들어가는 컨벤션이라 이슈를 반드시 먼저 만들게 된다. 템플릿이 있으면 "재현 방법 뭐예요?" 같은 왕복이 줄고, 심사 시점에 이슈 트래커가 그 자체로 작업 기록이 된다.

| 파일                            | 용도          | 자동 라벨             |
| ------------------------------- | ------------- | --------------------- |
| `ISSUE_TEMPLATE/feature.yml`    | 기능 제안     | `enhancement`         |
| `ISSUE_TEMPLATE/bug_report.yml` | 버그 리포트   | `bug`, `needs triage` |
| `ISSUE_TEMPLATE/refactor.yml`   | 리팩토링 제안 | `refactor`            |
| `ISSUE_TEMPLATE/docs.yml`       | 문서 작업     | `documentation`       |
| `pull_request_template.md`      | PR            | —                     |

PR 템플릿의 체크리스트는 **동작 확인 / 콘솔 오류 / 라우팅 / 빌드** 4항목이다. 화면 단위 PR에서 매번 확인해야 하는 것들이라 그대로 유지했다.

⚠️ **라벨은 GitHub 저장소에 실제로 존재해야 자동 적용된다.** `needs triage`, `refactor`는 기본 제공 라벨이 아니므로 저장소 설정에서 만들어야 한다.

---

## 8. CI 워크플로 — `.github/workflows/`

**하는 일** — PR과 push마다 검사를 자동 실행한다.

**필요한 이유** — 로컬 hook은 `--no-verify`로 우회할 수 있지만 CI는 못 한다. 머지 전 마지막 관문.

### `ci.yml` — Lint · Type · Format

- **트리거**: `develop`/`main`으로의 push와 PR
- **실행**: `npm ci` → `npm run lint` → `npm run typecheck` → `npm run format:check`
- Node 20, npm 캐시 사용
- `permissions: contents: read` + `persist-credentials: false` — 워크플로에 필요 최소 권한만 주고, checkout 후 러너에 자격 증명을 남기지 않는다

### `security.yml` — Dependency audit

- **트리거**: push, PR, **매주 월요일 00:00 UTC**, 수동 실행
- **실행**: `npm audit --audit-level critical --omit=dev`
- `--omit=dev`로 개발 의존성은 제외(런타임에 배포되지 않음), `critical` 등급만 빌드를 실패시켜 노이즈를 줄인다
- 주간 스케줄이 있는 이유: 코드를 안 건드려도 새 취약점은 발표된다

두 워크플로 모두 환경변수를 쓰지 않는다. 시크릿을 주입할 필요가 없어 그만큼 관리 지점이 줄어든다.

`develop` 브랜치가 실제 개발 기준선으로 운영 중이며, 모든 기능 PR이 `develop`을 base로 한다. 워크플로도 `develop` push/PR에서 정상 동작한다.

---

## 요약 — 발표용

| 설정                | 한 줄                                      | 우리 프로젝트에서의 이유                       |
| ------------------- | ------------------------------------------ | ---------------------------------------------- |
| Prettier            | 포맷 자동 통일                             | 2인 협업 diff 노이즈 제거, CI가 강제           |
| ESLint              | 정적 분석으로 버그·스타일 위반 차단        | Next.js 특유 실수 + import 순서 + `any` 금지   |
| TypeScript `strict` | 컴파일 타임 타입 검사                      | 외부 백엔드 응답을 다룰 때 null 처리 누락 방지 |
| husky + lint-staged | 커밋 시점 자동 검사                        | CI 한 바퀴 태우기 전에 로컬에서 차단           |
| commitlint          | 커밋 메시지 형식 강제                      | 이력 추적, 이슈 번호 연결                      |
| `.gitignore`        | `.env*` 차단                               | 비밀키 커밋 사고를 구조적으로 방지             |
| 이슈·PR 템플릿      | 작성 항목 사전 제시                        | 이슈 트래커가 곧 작업 기록                     |
| GitHub Actions      | PR마다 lint/type/format + 주간 취약점 감사 | 우회 불가능한 머지 게이트                      |

**이후 도입된 것** — 폼·검증(zod·react-hook-form, #5), 서버 상태(@tanstack/react-query, #70), API 계층(`src/lib/api.ts` 자체 작성). 규격 확정 이력은 [`deferred-setup.md`](./deferred-setup.md) 참고.

**아직 정하지 않은 것** — 전역 클라이언트 상태(Zustand), 테스트 러너, PWA 채택 여부. ([`deferred-setup.md`](./deferred-setup.md))
