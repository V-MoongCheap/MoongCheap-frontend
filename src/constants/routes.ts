/**
 * 동적 라우트 경로 생성 함수. features/ 컴포넌트가 경로 문자열을 직접 조립하지 않도록 한곳에 모은다.
 *
 * 페이지(서버 컴포넌트)는 경로를 만드는 함수를 클라이언트 컴포넌트에 prop으로 넘길 수 없고, 항목 id는
 * 목록 컴포넌트만 안다. 그래서 id 뒤에 세그먼트가 더 붙는 경로(예: B-16 대체상품)는 prop 주입 대신
 * 여기서 import 해 쓴다. 경로가 바뀌면 이 파일만 고친다.
 */
export const ROUTES = {
  /** B-08 상품 상세. */
  product: (productId: string) => `/products/${encodeURIComponent(productId)}`,
  /** B-16 대체상품 수락. 수요 기준 경로다. */
  substitute: (demandId: string) => `/demands/${encodeURIComponent(demandId)}/substitute`,
} as const;
