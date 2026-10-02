import { defineConfig, devices } from '@playwright/test';

import { E2E_API_BASE_URL, E2E_APP_PORT as PORT } from './src/tests/e2e/support/fakeApi';

// E2E는 운영과 같은 빌드(`next build` + `next start`)에 붙는다. dev 서버(3000)와 겹치지 않게 포트를
// 따로 쓴다. API 베이스 URL은 빌드에 박히므로 가짜 주소를 넣어 빌드하고, 그 주소로 나가는 요청은
// 테스트마다 `fakeApi`가 가로채 응답한다(실제 백엔드 없이 결과가 매번 같다).
export default defineConfig({
  testDir: './src/tests/e2e',
  // 유닛 테스트(Vitest)는 *.test.ts, E2E는 *.spec.ts로 나눈다.
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  // 서버 하나를 여러 브라우저가 동시에 두드리면 화면 이동이 느려져 시간 초과가 난다. 2개로 제한한다.
  workers: 2,
  // 화면 이동(서버 렌더 + 라우트 청크 로드)을 기다리는 시간. 기본 5초는 부하가 걸리면 빠듯하다.
  expect: { timeout: 10_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'ko-KR',
    colorScheme: 'light',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'mobile-chrome',
      // 서비스가 모바일 우선이라 모바일 뷰포트로 돌린다. 브라우저는 내려받지 않고 설치된 Chrome을 쓴다.
      use: { ...devices['Pixel 7'], channel: 'chrome' },
    },
  ],
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: { NEXT_PUBLIC_API_BASE_URL: E2E_API_BASE_URL },
  },
});
