import type { Page } from '@playwright/test';

import {
  CATALOG_ID,
  CATALOG_NAME,
  expect,
  expectNoNewA11yViolations,
  test,
} from './support/fixtures';

/**
 * 전체 동의. 실제 체크박스는 화면에서 숨겨져(sr-only) 있고 그 위에 체크 아이콘을 그린 구조라,
 * 사용자처럼 문구(label)를 눌러 켠다. 켜졌는지는 접근성 트리의 체크 상태로 확인한다.
 */
async function checkAllConsents(page: Page) {
  const label = '주문 내용 확인 및 결제동의';
  await page.getByText(label, { exact: true }).click();
  await expect(page.getByRole('checkbox', { name: label })).toBeChecked();
}

test.describe('수요 등록: 상품 상세 → 진행 안내 → 수요 등록 폼 → 내 대기', () => {
  test.beforeEach(({ backend }) => {
    backend.state.loggedIn = true;
  });

  test('희망 가격대와 필수 동의를 채워 접수하면 내 대기 목록에 나타난다', async ({
    page,
    backend,
  }) => {
    await page.goto(`/products/${CATALOG_ID}`);
    await page.getByRole('link', { name: '뭉치 참여하기' }).click();

    // 진행 안내(타임라인) → 확인
    await expect(page).toHaveURL(new RegExp(`/products/${CATALOG_ID}/timeline$`));
    await page.getByRole('link', { name: '확인' }).click();
    await expect(page).toHaveURL(new RegExp(`/products/${CATALOG_ID}/demand$`));

    // 필수 값 전에는 잠겨 있다
    const submit = page.getByRole('button', { name: '뭉치 참여하기' });
    await expect(submit).toBeDisabled();

    await page.getByRole('radio', { name: '1만원 이하' }).check();
    await expect(submit).toBeDisabled();
    await checkAllConsents(page);
    await expect(submit).toBeEnabled();
    await expectNoNewA11yViolations(page, '수요 등록 폼');

    await submit.click();

    // 접수 완료 안내 후 내 대기로 이동, 방금 접수한 상품이 보인다
    await expect(page.getByText('접수 완료!', { exact: false })).toBeVisible();
    await expect(page).toHaveURL(/\/waiting$/);
    await expect(page.getByText(CATALOG_NAME)).toBeVisible();
    await expectNoNewA11yViolations(page, '내 대기');

    // 폼 값이 등록 요청으로 그대로 옮겨졌다(가격 구간 경계값, 동의 4종 1:1)
    const created = backend.requests.find(
      (r) => r.method === 'POST' && r.path === '/api/members/me/demand',
    );
    expect(created?.body).toEqual({
      catalogId: CATALOG_ID,
      payMethodId: 1,
      desiredPriceMin: 5_001,
      desiredPriceMax: 10_000,
      quantity: 1,
      isSubstitutable: false,
      autoPaymentAgreed: true,
      privacyCollectionAgreed: true,
      privacyThirdPartyAgreed: true,
      paymentAgencyTermsAgreed: true,
    });
  });

  test('결제수단이 없으면 동의를 모두 해도 접수 버튼이 잠겨 있다', async ({ page, backend }) => {
    backend.state.paymentMethods = [];

    await page.goto(`/products/${CATALOG_ID}/demand`);
    await page.getByRole('radio', { name: '1만원 이하' }).check();
    await checkAllConsents(page);

    await expect(page.getByRole('button', { name: '뭉치 참여하기' })).toBeDisabled();
    expect(backend.requests.some((r) => r.method === 'POST')).toBe(false);
  });
});
