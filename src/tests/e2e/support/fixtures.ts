import AxeBuilder from '@axe-core/playwright';
import { test as base, expect, type Page } from '@playwright/test';

import { FakeBackend, type FakeBackendState } from './fakeApi';

/** 테스트 계정. 실제 계정이 아니라 가짜 백엔드 안에서만 쓰는 값이다. */
export const E2E_MEMBER = { loginId: 'moonge2e', password: 'E2e-test!', nickname: '뭉치테스터' };

export const CATALOG_ID = 1;
export const CATALOG_NAME = '[종근당건강] 락토핏 생유산균 코어맥스 E2E';

/** 매 테스트가 같은 데이터로 시작하도록 새로 만든다(테스트끼리 상태가 섞이지 않는다). */
function createInitialState(): FakeBackendState {
  return {
    member: { ...E2E_MEMBER },
    loggedIn: false,
    catalogs: [
      {
        id: CATALOG_ID,
        name: CATALOG_NAME,
        thumbnailUrl: '/images/product-detail/2-5.webp',
        listPrice: 32_000,
        specSummary: '프로바이오틱스 80포 160g',
        description: 'E2E 테스트용 상품 설명입니다.',
      },
    ],
    catalogBoards: {
      [CATALOG_ID]: [
        {
          id: 501,
          participantCount: 42,
          sellerCount: 3,
          priceMin: 5_001,
          priceMax: 10_000,
          saleEndAt: '2026-12-31T23:00:00',
          isParticipating: false,
        },
      ],
    },
    addresses: [],
    paymentMethods: [
      {
        id: 1,
        provider: '신한카드',
        number: '1234-****-****-5678',
        isDefault: true,
        status: 'ACTIVE',
      },
    ],
    myDemands: [],
  };
}

export const test = base.extend<{ backend: FakeBackend }>({
  // auto: 테스트가 `backend`를 인자로 받지 않아도 항상 붙인다. 빠지면 요청이 존재하지 않는
  // 가짜 주소로 실제로 나가 '네트워크 오류'가 된다.
  backend: [
    async ({ page }, use) => {
      const backend = new FakeBackend(createInitialState());
      await backend.install(page);
      await use(backend);
      // 화면이 예상하지 못한 API를 불렀다면 여기서 드러난다.
      expect(backend.unhandled, '가짜 백엔드에 처리 규칙이 없는 요청').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/**
 * 이미 알려진 접근성 위반(Phase 4 접근성 보고서 기준선). 원인이 브랜드·보조 색상 토큰이라 디자인
 * 결정을 기다리는 중이다. 고치면 여기서 지워 다시 검사 대상에 넣는다.
 */
const KNOWN_A11Y_RULES = ['color-contrast', 'scrollable-region-focusable'];

/**
 * WCAG 2.1 A/AA 자동 접근성 검사(axe). 기준선 밖의 위반이 하나라도 있으면 실패한다.
 * 기준선 규칙의 위반 건수는 리포트에 남긴다.
 */
export async function expectNoNewA11yViolations(page: Page, screen: string) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const known = result.violations.filter((v) => KNOWN_A11Y_RULES.includes(v.id));
  const fresh = result.violations.filter((v) => !KNOWN_A11Y_RULES.includes(v.id));

  test.info().annotations.push({
    type: 'a11y',
    description: `${screen}: 새 위반 ${fresh.length}건, 기준선 ${
      known.map((v) => `${v.id} ${v.nodes.length}`).join(', ') || '없음'
    }`,
  });
  expect(
    fresh.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(' | ')})`),
    `${screen} 접근성 위반`,
  ).toEqual([]);
}
