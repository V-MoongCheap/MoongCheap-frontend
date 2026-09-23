# 라우트 맵 (route map)

실제 `src/app` App Router 세그먼트 기준입니다. 화면 퍼블리싱이 진행되며 라우트가 쌓였고, 이 문서는 **머지된 라우트**를 반영합니다. 진행 중 PR(하단 참고)이 추가하는 라우트는 머지 시 갱신합니다.

## 서비스 흐름 (요지)

소비자가 원하는 상품의 **수요를 등록** → 같은 수요가 모이면 **셀러들이 응찰** → 조건이 가장 좋은 응찰이 **자동 낙찰** → 주문·결제 → 정산.

- 역할: **소비자(buyer)** 중심. 셀러 전용 화면(S-01 판매자 전환 등)은 소비자 앱 안에 일부만 존재하고, 셀러 대시보드 영역은 미착수.

## 라우트 그룹 · 셸(layout)

| 그룹/세그먼트 | layout 역할                                                                 |
| ------------- | --------------------------------------------------------------------------- |
| `(auth)`      | 인증 화면 셸(모바일 폭 393). `error.tsx` 에러 바운더리 포함                 |
| `(main)`      | 하단 탭바(`BottomNav`) 있는 셸. 탭: 홈 `/` · 대기 `/waiting` · MY `/mypage` |
| `products/`   | 상품 관련 셸                                                                |
| `demands/`    | 수요 상세 셸                                                                |
| `mypage/`     | 마이페이지 셸                                                               |
| `orders/`     | 주문 셸                                                                     |

> 인증 가드는 현재 **leaf 리다이렉트**(보호 화면이 세션 확인 후 미로그인 시 `/login`으로 replace, 예: 마이페이지)로 처리. 라우트그룹 layout/미들웨어 가드로의 승격은 후속 과제(#70에서 유예).

## 라우트 목록

| 경로                             | 화면 / 비고                                 | 그룹       |
| -------------------------------- | ------------------------------------------- | ---------- |
| `/`                              | 홈(B-03). 검색바·배너·브랜드딜·상품 카드    | `(main)`   |
| `/waiting`                       | 대기 탭                                     | `(main)`   |
| `/login`                         | 로그인(B-01). 일반+소셜(카카오·구글)        | `(auth)`   |
| `/signup`                        | 회원가입                                    | `(auth)`   |
| `/oauth/callback`                | 소셜 로그인 성공 착지 → 세션 확인 후 라우팅 | `(auth)`   |
| `/oauth/complete`                | 소셜 최초가입 미완료(약관+닉네임) 완료 스텝 | `(auth)`   |
| `/oauth/failed`                  | 소셜 로그인 실패 안내                       | `(auth)`   |
| `/products/[productId]`          | 상품 상세(B-08)                             | `products` |
| `/products/[productId]/timeline` | 일정 타임라인(FN-B09-05). B-09 앞 단계      | `products` |
| `/demands/[demandId]`            | 수요 상세(B-12)                             | `demands`  |
| `/award-result`                  | 낙찰 성공 정보(B-19)                        | (root)     |
| `/mypage`                        | 마이페이지(B-26)                            | `mypage`   |
| `/mypage/profile/edit`           | 프로필 설정(B-24)                           | `mypage`   |
| `/mypage/notifications/settings` | 알림 설정(B-25)                             | `mypage`   |
| `/mypage/addresses`              | 배송지 목록                                 | `mypage`   |
| `/mypage/addresses/new`          | 배송지 추가                                 | `mypage`   |
| `/mypage/addresses/[id]/edit`    | 배송지 수정                                 | `mypage`   |
| `/mypage/payment-methods`        | 결제수단(B-14, 토스 브랜드페이 전환)        | `mypage`   |
| `/mypage/seller-apply`           | 판매자 전환(S-01)                           | `mypage`   |
| `/orders`                        | 주문 목록(B-21)                             | `orders`   |
| `/orders/[orderId]`              | 주문 상세                                   | `orders`   |

## 작업 진행 중

- **`/search`, `/search/results`** (검색 입력 B-05 · 결과 B-06) — PR #81. `(main)` 그룹. `GET /api/products-search/search` 연동.
- **`/products/[productId]/demand`** (수요 등록/참여 B-09) — PR #85.
- **`/splash`** (스플래시, 검수용 임시 라우트 — 배선 후 삭제) — PR #83.

## 남은 것

- 셀러 대시보드/응찰 영역(별도 라우트 또는 역할 분기) — 미착수.
- 장바구니(B-13)·결제 플로우 — 백엔드 거래 API 확정 후.
- 인증 가드를 leaf-redirect → 라우트그룹 layout/미들웨어로 승격.
- 각 화면의 실제 호출 API 매핑은 백엔드 Swagger(도메인 A·B) 기준.
