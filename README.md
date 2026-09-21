<div align="center">

<img src="./docs/assets/wordmark.svg" alt="뭉치" width="150" />

### 뭉치면 싸다!

수요 집결형 역경매 공동구매 플랫폼 프론트엔드<br />
kt cloud TECH UP 2기 통합 프로젝트 2팀 · 브이

<p>
  <a href="https://github.com/V-MoongCheap/MoongCheap-frontend/actions/workflows/ci.yml"><img src="https://github.com/V-MoongCheap/MoongCheap-frontend/actions/workflows/ci.yml/badge.svg?branch=develop" alt="CI" /></a>
  <a href="https://github.com/V-MoongCheap/MoongCheap-frontend/actions/workflows/security.yml"><img src="https://github.com/V-MoongCheap/MoongCheap-frontend/actions/workflows/security.yml/badge.svg?branch=develop" alt="Security" /></a>
</p>

<p>
  <img src="https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=next.js&logoColor=white" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/TanStack_Query_v5-FF4154?style=flat-square&logo=reactquery&logoColor=white" alt="TanStack Query v5" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Node_20-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node 20" />
</p>

<p>
  <a href="#무엇을-만드나">무엇을 만드나</a> ·
  <a href="#진행-상황">진행 상황</a> ·
  <a href="#시작하기">시작하기</a> ·
  <a href="#기술-스택">기술 스택</a> ·
  <a href="#디자인-토큰">디자인 토큰</a> ·
  <a href="#개발-흐름">개발 흐름</a>
</p>

</div>

---

## 무엇을 만드나

기존 공동구매는 판매자가 조건을 먼저 정하고 소비자를 모읍니다. 뭉치는 순서를 뒤집습니다.

```text
수요 등록  ->  판매자 응찰  ->  라운드 마감  ->  낙찰  ->  자동 결제  ->  발송  ->  수령 확인
 상품·수량      가격·수량 조건     7일         총액 최저 1건   48시간 뒤
```

| 단계            | 무슨 일이 일어나나                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| **수요 등록**   | 소비자가 상품과 수량을 올립니다. **가격은 입력하지 않습니다.** AI 챗봇이 주 진입점입니다               |
| **응찰**        | 판매자가 수요를 보고 가격·최소 성사 수량·최대 공급 가능 수량을 제시합니다. 수요 지정 없이는 불가합니다 |
| **라운드 마감** | 등록 7일 후 자동 마감됩니다. 수요 등록과 응찰이 같은 구간에서 **동시에** 진행됩니다                    |
| **낙찰**        | 총액이 가장 낮은 응찰 1건을 고릅니다. **부분 낙찰은 없습니다.** 최소 성사 수량에 못 미치면 미달입니다  |
| **결제**        | 낙찰 후 **48시간이 취소 가능 기한**이고, 경과하면 등록된 결제수단으로 일괄 자동결제됩니다              |
| **발송·수령**   | 판매자가 운송장을 입력하면 배송이 시작됩니다. 배송완료 7일 뒤 자동 수령완료, 청약철회 7일 후 정산 확정 |

> **용어 주의.** "딜(deal)"이라는 단일 엔티티는 없습니다. `수요(Board)` -> `상품(Product, 곧 응찰)` -> `공동구매(GroupBuy)` 3단 구조입니다. 라우트·타입·목 데이터는 모두 이 3단을 따릅니다.
>
> **정본 순서.** 문서가 서로 어긋나면 아래 순서로 따릅니다.
>
> 1. 디스코드 `의사결정-기록채널` - 가장 최신 결정
> 2. IA 「수요 상태 정의」 탭 - 상태 이름·기한·판정 규칙
> 3. IA 나머지 시트 - **색칠된 행은 수정 중이므로 구현하지 않습니다**
>
> 상태는 위 목록에 없는 것을 임의로 추가하지 않습니다.

**소비자는 다른 사람의 수요를 조회할 수 없습니다.** 소비자 홈은 수요 목록이 아니라 낙찰 상품 게시판이고, 수요 목록은 판매자 전용 화면입니다.

### 백엔드는 별도 저장소

이 저장소는 프론트엔드만 담고 있습니다. 백엔드는 REST API로 제공되며 두 도메인으로 나뉩니다. 프론트는 양쪽을 모두 소비합니다.

| 도메인                     | 범위                                                 |
| -------------------------- | ---------------------------------------------------- |
| **도메인 A** 카탈로그·계정 | 인증, 회원, 상품, 재고, 알림, 검색, AI 챗봇          |
| **도메인 B** 거래·공동구매 | 장바구니, 주문, 결제, 공구 딜, 참여, 성사 판정, 정산 |

`src/app/api/` Route Handler는 두지 않습니다.

---

## 진행 상황

MVP 화면 퍼블리싱을 마치고 실 API 연동을 진행 중입니다. 백엔드 규격이 나온 영역부터 연동했고, 규격이 없는 화면은 `src/mocks/`의 목 데이터로 동작합니다.

| 영역           | 상태                                                                     |
| -------------- | ------------------------------------------------------------------------ |
| 프로젝트 세팅  | 완료 · 툴링 · CI · 컨벤션 · 이슈/PR 템플릿                               |
| 디자인 토큰    | 완료 · 생성 파이프라인 · 다크 모드 · 반응형 기준폭                       |
| 공통 레이어    | 완료 · 상태 레지스트리 · 화면 카탈로그 · 비즈니스 상수 · 공용 UI 18종    |
| 인증           | **연동 완료** · 소셜 로그인 · 세션 · 닉네임 변경 · 회원탈퇴              |
| 홈피드         | 퍼블리싱 완료 · 카드 5종 · 배너 캐러셀 · 마감 타이머                     |
| 상품 도감 검색 | **연동 완료** · 검색 · 최근 검색어 · 필터 탭                             |
| 상품 상세      | 퍼블리싱 완료 · 상품 도감 상세 **연동 완료**                             |
| 수요 등록·참여 | 퍼블리싱 완료 · 수요 등록 **연동 완료** · 참여 목록 연동은 리뷰 중       |
| 낙찰 결과      | 퍼블리싱 완료 · 백엔드 응답에 없는 항목이 있어 연동 보류                 |
| 마이페이지     | 완료 · 허브 · 프로필 · 알림 설정 · 배송지(**연동 완료**)                 |
| 주문           | **연동 완료** · 주문 내역 · 주문 상세                                    |
| 결제           | 대기 · 백엔드에 결제 엔드포인트 없음. 결제수단 등록 화면은 퍼블리싱 완료 |
| 판매자 전환    | 퍼블리싱 완료 · 사업자번호 검증 API 없음                                 |
| 배포           | 완료 · `output: 'standalone'` 기반 컨테이너 이미지                       |
| 반응형         | 토큰 기반 완료 · 화면별 3폭 적용은 후속                                  |

연동하지 않은 화면과 그 이유는 [`docs/deferred-setup.md`](./docs/deferred-setup.md)에 있습니다.

---

## 시작하기

Node 20 (`.nvmrc`), 패키지 매니저는 **npm**입니다.

```bash
npm ci                # package-lock.json 기준 설치 (npm install 대신 권장)
cp .env.local.example .env.local
npm run dev           # http://localhost:3000
```

| 스크립트               | 하는 일                         |
| ---------------------- | ------------------------------- |
| `npm run dev`          | 개발 서버 (Turbopack)           |
| `npm run build`        | 프로덕션 빌드                   |
| `npm run lint`         | ESLint (`-- --fix`로 자동 수정) |
| `npm run typecheck`    | `tsc --noEmit`                  |
| `npm run format`       | Prettier 적용                   |
| `npm run format:check` | Prettier 검사 (CI용)            |

### 환경변수

현재 필요한 값은 하나뿐입니다. 비워 두면 소셜 로그인 버튼이 비활성화될 뿐, 나머지 화면은 정상 동작합니다.

```dotenv
NEXT_PUBLIC_API_BASE_URL=   # 백엔드 베이스 URL. 소셜 로그인 인가 이동의 기준 주소
```

### 컨테이너로 실행

`output: 'standalone'` 기반이라 런타임에 필요한 파일만 담습니다. 비루트 사용자로 실행합니다.

```bash
docker build --build-arg NEXT_PUBLIC_API_BASE_URL=http://localhost:8080 -t moongcheap-frontend .
docker run --rm -p 3000:3000 moongcheap-frontend
```

> ⚠️ `NEXT_PUBLIC_*` 값은 **빌드 시점에 번들로 들어갑니다.** 런타임 환경변수로 주입해도 반영되지 않으므로 배포 파이프라인에서 빌드 인자로 전달해야 합니다.

---

## 기술 스택

실제로 설치된 것만 적었습니다. 도입을 미룬 것과 그 이유는 [`docs/deferred-setup.md`](./docs/deferred-setup.md)에 있습니다.

| 분류       | 사용 기술                                         | 고른 이유                                                                                       |
| ---------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 프레임워크 | Next.js 16 (App Router, Turbopack)                | 수요 -> 응찰 -> 공동구매 -> 주문으로 이어지는 화면 흐름을 라우트 구조로 그대로 표현             |
| UI         | React 19                                          | 상품 카드·응찰 목록처럼 반복되는 UI의 재사용                                                    |
| 언어       | TypeScript (`strict`, `any` 금지)                 | 외부 백엔드 응답을 다룰 때 생기는 null 처리 누락을 컴파일 타임에 차단                           |
| 스타일     | Tailwind CSS v4 + `clsx` + `tailwind-merge`       | CSS-first 설정이라 디자인 토큰을 CSS 변수로 그대로 주입할 수 있음                               |
| 서버 상태  | TanStack Query v5                                 | 세션·주문·배송지가 같은 캐시를 공유해 중복 요청을 없애고, 로그아웃 시 캐시를 한 번에 비움       |
| 아이콘     | `lucide-react`                                    | 시안 글리프와 맞는 아이콘은 에셋 대신 대체해 번들·만료 URL 문제를 피함                          |
| 폼·검증    | `react-hook-form` + `zod` + `@hookform/resolvers` | 비제어 입력이라 리렌더가 적고, 검증 규칙을 스키마 한 곳에 모아 서버 규칙 확정 시 그 파일만 교체 |
| 품질       | ESLint · Prettier · `import/order`                | 2인 협업에서 스타일 편차와 diff 노이즈 제거                                                     |
| Git 훅     | husky · lint-staged · commitlint                  | 커밋 시점에 lint·typecheck·메시지 규칙을 검사해 CI 실패를 로컬에서 차단                         |
| CI         | GitHub Actions                                    | PR마다 lint · typecheck · format 검사, 주간 의존성 취약점 감사                                  |
| 배포       | Docker (`output: 'standalone'`)                   | 런타임에 필요한 파일만 담아 이미지를 줄이고 비루트 사용자로 실행                                |
| 협업       | GitHub · Notion · Figma · Discord                 | 코드 · 문서 · 디자인 · 소통 분리                                                                |

각 설정의 상세 근거와 커스텀 룰 설명은 [`docs/setup-decisions.md`](./docs/setup-decisions.md)에 있습니다.

### 백엔드와 확정된 규격

| 항목           | 내용                                                                               |
| -------------- | ---------------------------------------------------------------------------------- |
| 인증 방식      | 세션 기반. SID를 httpOnly 쿠키로 주고받고 토큰을 JS로 저장하지 않음                |
| 공용 응답 포맷 | 성공은 래퍼 없는 DTO, 실패만 `{ code, message, fieldErrors }` 봉투                 |
| API 베이스 URL | 단일 `NEXT_PUBLIC_API_BASE_URL`. 도메인 A·B를 구분하지 않음                        |
| 에러 코드      | HTTP status + 비즈니스 코드(`AUTH_014` 등). `src/lib/api.ts`가 `ApiError`로 정규화 |
| 결제 방식      | 토스페이먼츠 빌링키. 프론트가 결제창을 띄우는 건 결제수단 등록 때뿐                |

세션이 httpOnly 쿠키라 **인증이 필요한 조회는 클라이언트에서 부릅니다.** Next 서버에는 쿠키 저장소가 없어 서버 컴포넌트에서 호출하면 401이 납니다.

### 아직 안 정해진 것

| 항목                 | 상태                                                   |
| -------------------- | ------------------------------------------------------ |
| 전역 클라이언트 상태 | 미도입. 서버 상태는 Query 캐시로 충분해 Zustand를 보류 |
| 테스트 러너          | 미정                                                   |
| PWA                  | 미정                                                   |

---

## 프로젝트 구조

레이어와 기능을 섞은 하이브리드 구조입니다. 자세한 규칙은 [`.agents/structure-convention/SKILLS.md`](./.agents/structure-convention/SKILLS.md)에 있습니다.

의존 방향은 **한 방향**입니다. 어기면 리뷰에서 지적합니다.

```text
app (페이지) -> features (도메인) -> components/ui (프리미티브)
```

- `components/ui`는 도메인을 몰라야 합니다. 특정 화면·기능 이름이 들어가면 안 됩니다
- `features`는 라우트 문자열을 직접 들고 있지 않습니다. 경로는 props로 받습니다
- 공용 컴포넌트는 **두 번째 사용처가 생겼을 때** 올립니다. 미리 만들지 않습니다
- `@/` -> `src/` 경로 별칭을 씁니다

<details>
<summary><b>디렉터리 트리 펼쳐 보기</b></summary>

```text
MoongCheap-frontend
├── .agents/                  # 팀 개발 컨벤션 (에이전트 자동 로드)
├── .github/                  # 이슈·PR 템플릿, CI 워크플로
├── .husky/                   # commit-msg(commitlint), pre-commit(lint-staged + typecheck)
├── design/tokens/            # 디자인 토큰 파이프라인 (아래 섹션 참고)
│   ├── raw/                  # 디자인팀이 전달한 Figma Variables JSON (원본)
│   └── build-tokens.mjs      # raw -> src/app/globals.css 생성기
├── docs/                     # 컨벤션·설정 근거·보안 요건
├── Dockerfile                # standalone 기반 컨테이너 이미지
└── src/
    ├── app/                  # App Router. 페이지는 조립만 한다
    │   ├── (auth)/           #   로그인·회원가입·소셜 콜백
    │   ├── (main)/           #   홈피드·내 참여 목록(탭 셸)
    │   ├── award-result/     #   낙찰 결과
    │   ├── demands/          #   수요 상세
    │   ├── mypage/           #   마이페이지·프로필·알림·배송지·결제수단
    │   ├── orders/           #   주문 내역·상세
    │   ├── products/         #   상품 상세·수요 등록
    │   └── search/           #   상품 도감 검색·결과
    ├── components/
    │   ├── layout/           # 셸 요소 (AppBar, BottomNav …)
    │   └── ui/               # 도메인을 모르는 프리미티브 (Button, Toast, Skeleton …)
    ├── features/             # 도메인 컴포넌트. features/user/components/…
    ├── constants/            # 상태 레지스트리·화면 카탈로그·비즈니스 상수·공통 문구
    ├── hooks/                # 커스텀 훅
    ├── lib/                  # API 계층(api.ts)과 유틸 (cn, oauth, queryRetry …)
    ├── mocks/                # API 미연동 구간용 목 데이터
    ├── schemas/              # zod 폼 스키마
    ├── types/                # 화면이 요구하는 타입
    └── tests/                # 테스트 설정 (러너 미정)
```

</details>

---

## 디자인 토큰

색·간격·타이포를 코드에 직접 쓰지 않습니다. 디자인팀이 준 Figma Variables JSON에서 CSS 변수를 **생성**합니다.

```bash
node design/tokens/build-tokens.mjs   # design/tokens/raw/ -> src/app/globals.css
npm run format
```

> ⚠️ **`src/app/globals.css`를 직접 고치지 마세요.** 생성 파일이라 다음 실행 때 덮어써집니다. 값을 바꾸려면 `design/tokens/raw/`의 JSON을 교체하고 생성기를 다시 돌립니다.

이름을 두 층으로 나눠 내보냅니다. 합치면 유틸리티에 라이트 값이 박혀 다크모드가 죽습니다.

```css
/* 1층: 모드가 갈리는 값 */
:root {
  --content-primary: #0a0a0a;
}

/* 2층: 유틸리티를 만들어 내는 이름 */
@theme inline {
  --color-content-primary: var(--content-primary);
}
```

그래서 화면 코드에서는 항상 시맨틱 유틸리티만 씁니다.

```tsx
<p className="text-body-15 text-content-primary">닉네임</p> // ✅
<p className="text-[15px] text-gray-900">닉네임</p> // ❌ 기본 Tailwind 값
```

프론트는 Figma **View 권한**입니다(2026-08-21부터). 토큰 값의 원본은 언제나 `design/tokens/raw/`의 JSON입니다.

---

## 개발 흐름

전체 규칙은 [`docs/convention/README.md`](./docs/convention/README.md), 완료 기준은 [`docs/convention/definition-of-done.md`](./docs/convention/definition-of-done.md)에 있습니다.

```text
이슈 생성  ->  develop에서 브랜치  ->  작업·커밋  ->  PR  ->  승인 1명 + CI 통과  ->  squash 머지
```

| 항목      | 형식                                                                | 예시                                  |
| --------- | ------------------------------------------------------------------- | ------------------------------------- |
| 브랜치    | `유형/#이슈번호/설명`                                               | `feat/#25/notification-settings`      |
| 커밋      | `유형: 상세설명 (#이슈번호)`                                        | `feat: 알림 설정 화면 퍼블리싱 (#25)` |
| 허용 유형 | `feat` `fix` `hotfix` `style` `refactor` `chore` `docs` `init` `ci` |                                       |

<details>
<summary><b>주의할 점 세 가지</b></summary>

- 브랜치명에 `#`가 들어가므로 zsh에서는 따옴표로 감싸야 합니다. `git push -u origin 'feat/#25/...'`
- 커밋 제목 맨 앞에 영문 대문자를 쓰면 commitlint가 거부합니다(`subject-case`). 제품명·컴포넌트명을 문두에 두지 마세요
- husky pre-commit에 막히면 `--no-verify`로 우회하지 말고 원인을 고칩니다

</details>

### 자동 검사

| 시점   | 검사                                                                   |
| ------ | ---------------------------------------------------------------------- |
| commit | commitlint(메시지) · lint-staged · 전체 typecheck                      |
| PR     | GitHub Actions - lint · typecheck · format:check                       |
| PR     | CodeRabbit 자동 리뷰 - 설정은 [`.coderabbit.yaml`](./.coderabbit.yaml) |
| 주간   | 의존성 취약점 감사 (`security.yml`)                                    |

---

## 팀

| <a href="https://github.com/Hyejinjin-An"><img src="https://avatars.githubusercontent.com/u/115617565?v=4" width="110" alt="안혜진" /></a> | <a href="https://github.com/ParkSiYeol3"><img src="https://avatars.githubusercontent.com/u/162967437?v=4" width="110" alt="박시열" /></a> |
| :----------------------------------------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------: |
|                                               **[안혜진](https://github.com/Hyejinjin-An)**                                                |                                               **[박시열](https://github.com/ParkSiYeol3)**                                                |
|                             인증 화면(로그인·회원가입·소셜)<br />공통 레이어(상태·상수·화면 카탈로그·공통 UI)                              |                    프로젝트 세팅 · 디자인 토큰 파이프라인<br />마이페이지 계열(허브·프로필·알림·배송지) · 판매자 전환                     |

---

## 문서

| 문서                                                                               | 내용                                    |
| ---------------------------------------------------------------------------------- | --------------------------------------- |
| [`.agents/README.md`](./.agents/README.md)                                         | 코드 스타일 · 폴더 구조 · 디자인 컨벤션 |
| [`docs/convention/README.md`](./docs/convention/README.md)                         | 브랜치 · 커밋 · PR 규칙                 |
| [`docs/convention/definition-of-done.md`](./docs/convention/definition-of-done.md) | 작업 완료 기준 · PR 리뷰 체크리스트     |
| [`docs/setup-decisions.md`](./docs/setup-decisions.md)                             | 각 도구 설정의 근거, 커스텀 룰 설명     |
| [`docs/deferred-setup.md`](./docs/deferred-setup.md)                               | 지금 가져오지 않은 것과 재검토 시점     |
| [`docs/security-baseline.md`](./docs/security-baseline.md)                         | 인프라·백엔드에 요청하는 보안 최소 요건 |
| [`docs/route-map.md`](./docs/route-map.md)                                         | 라우트 맵 초안                          |
| [`design/tokens/README.md`](./design/tokens/README.md)                             | 토큰 생성기 사용법과 이름 두 층 구조    |
| [`CLAUDE.md`](./CLAUDE.md)                                                         | 에이전트용 프로젝트 지침                |
