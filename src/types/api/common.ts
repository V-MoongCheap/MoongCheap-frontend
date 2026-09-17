/**
 * 도메인 공통 백엔드 응답 타입.
 *
 * 여러 도메인이 같은 모양으로 쓰는 응답만 모은다. 도메인별 DTO는 각 `types/api/*.ts`에 둔다.
 */

/**
 * 등록·생성 계열 응답의 공통 스키마. 백엔드 공통 `IdResponse`.
 *
 * ⚠️ `Map<String, Long>`이 아니라 단일 필드 객체다(`{ "id": 123 }`). 배송지 등록·수요 등록 등
 * 생성 엔드포인트가 모두 이 모양을 돌려준다. 문자열 id가 필요한 화면·라우트는 호출부(각 api 모듈)가
 * `String(id)`로 맞춘다.
 */
export interface IdResponse {
  id: number;
}
