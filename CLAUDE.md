@AGENTS.md

# CLAUDE.md

**MoongCheap(뭉치)** 프론트엔드 저장소입니다.

## 프로젝트

수요 집결형 공동구매 플랫폼. 소비자가 원하는 상품의 수요를 먼저 등록하고, 같은 수요가 모이면 셀러들이 응찰해 조건이 가장 좋은 응찰이 자동 낙찰되는 **역경매형 공동구매** 서비스입니다.

kt cloud TECH UP 2기 통합 프로젝트 2팀. 프론트엔드 2명, 백엔드는 **별도 저장소에서 REST API로 제공**됩니다.

## 백엔드 도메인 분할

| 도메인                     | 범위                                                 |
| -------------------------- | ---------------------------------------------------- |
| **도메인 A** 카탈로그·계정 | 인증, 회원, 상품, 재고, 알림, 검색, AI 챗봇          |
| **도메인 B** 거래·공동구매 | 장바구니, 주문, 결제, 공구 딜, 참여, 성사 판정, 정산 |

프론트는 두 도메인의 API를 모두 소비합니다. **Supabase를 사용하지 않습니다.**

## 현재 스택

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · ESLint · Prettier · husky + commitlint

**폼·검증**: react-hook-form · zod · @hookform/resolvers (인증 폼 착수 시 도입, PR #5).

**서버 상태**: @tanstack/react-query (세션 조회 전역 상태 확립 시 도입, #70).

**테스트**: Vitest (순수 로직 단위 테스트, node 환경, `src/tests/**/*.test.ts`, #240) · Playwright (핵심 흐름 E2E + axe 접근성 검사, 가짜 백엔드, `src/tests/e2e/*.spec.ts`, #242). `npm run test` / `npm run test:e2e`.

**아직 설치하지 않은 것**: 전역 클라이언트 상태(Zustand). 필요한 시점에 추가합니다. → [`docs/deferred-setup.md`](docs/deferred-setup.md)

## 규격 — 확정된 것과 아직 미정인 것

MVP 화면과 핵심 거래 흐름(수요 등록 → 참여 → 낙찰 → 주문)이 실 API로 연동되어 QA·시연 대응 단계입니다. 아래 **미정** 항목은 여전히 추측으로 채우지 말고, 규격이 나온 뒤에 작성합니다.

**결정됨**

- **인증 방식**: 세션 = **httpOnly 쿠키(SID)**. 소셜/일반 로그인 동일 구조, 토큰을 JS로 저장하지 않음.
- **공용 응답 포맷**: 성공 = 래퍼 없는 **bare DTO**, 실패만 `{ success:false, data:null, error:{ code, message, fieldErrors } }` 봉투.
- **API 베이스 URL**: 단일 `NEXT_PUBLIC_API_BASE_URL`(도메인 A·B 구분 없음, 로컬 `http://localhost:8080`). `apiFetch`가 `credentials:'include'`로 붙임.
- **에러 코드**: HTTP status + 비즈니스 코드(봉투 `error.code`, 예: `COMMON_401`).

**미정 (합의/결정 전 — 추측 금지)**

- **PWA 채택 여부** — 미정. 현재 관련 의존성·설정 없음.
- **도메인 B 남은 범위** — 수요 등록·참여·대체상품·낙찰 결과·주문 목록/상세·결제수단 조회/기본 지정은 실 API 연동 완료. 장바구니·정산·결제수단 등록·참여/낙찰 취소는 미확정이라 화면에 넣지 않거나 '준비 중' 안내로 둔다.
- **목(mock) 잔여** — 홈피드·회원가입·알림 설정(마케팅 동의)·판매자 전환은 백엔드 규격이 없어 `src/mocks/`로 동작한다. 규격이 나오면 함수 본문만 API 호출로 교체한다.

자세한 근거·해소 이력은 [`docs/deferred-setup.md`](docs/deferred-setup.md) 참고.

## 문서

- [`.agents/README.md`](.agents/README.md) — 코드 스타일·폴더 구조·디자인 컨벤션 (`SKILLS.md`, 항상 로드)
- [`docs/convention/README.md`](docs/convention/README.md) — 브랜치·커밋·PR 규칙 (**오늘부터 적용**)
- [`docs/setup-decisions.md`](docs/setup-decisions.md) — 각 도구 설정의 근거, 커스텀 룰 설명
- [`docs/deferred-setup.md`](docs/deferred-setup.md) — 지금 가져오지 않은 것과 재검토 시점
- [`docs/security-baseline.md`](docs/security-baseline.md) — 인프라/백엔드에 요청하는 보안 최소 요건

## 핵심 규칙 요약

- 커밋: `유형: 상세설명 (#이슈번호)` / 브랜치: `유형/#이슈/설명`
- 허용 커밋 타입: `feat` `fix` `hotfix` `style` `refactor` `chore` `docs` `init` `ci` (`commitlint.config.mjs`가 강제)
- `develop`에서 브랜치 → PR → **squash 머지** (팀원 1명 승인 + CI 통과)
- `export function` 사용(default export 지양 — App Router 예약 파일·설정 파일은 예외), `any` 금지, 인라인 스타일 금지
- import 순서는 `import/order`가 자동 정렬 (`npm run lint -- --fix`)
- 비밀키는 `.env.local`(로컬)·`.env`(배포)에만. `.gitignore`가 `.env*` 전체를 차단
- husky hook에 막히면 `--no-verify`로 우회하지 말고 원인을 먼저 해결
