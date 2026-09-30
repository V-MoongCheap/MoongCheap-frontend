import { defineConfig } from 'vitest/config';

// 단위 테스트는 src/tests/ 아래에 둔다(.agents/structure-convention). 지금은 순수 로직만 다뤄
// node 환경으로 충분하다. 컴포넌트 테스트를 들일 때 jsdom·Testing Library를 추가한다.
export default defineConfig({
  resolve: {
    // tsconfig의 `@/*` → `src/*` 별칭을 그대로 쓴다(Vite 내장).
    tsconfigPaths: true,
  },
  test: {
    environment: 'node',
    include: ['src/tests/**/*.test.ts'],
  },
});
