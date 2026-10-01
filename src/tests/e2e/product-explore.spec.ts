import { CATALOG_NAME, expect, expectNoNewA11yViolations, test } from './support/fixtures';

test.describe('상품 탐색: 홈 → 검색 → 상품 상세', () => {
  test('검색한 상품의 상세에서 실제 도감 정보와 진행 중인 뭉치를 본다', async ({
    page,
    backend,
  }) => {
    backend.state.loggedIn = true;

    await page.goto('/');
    await expectNoNewA11yViolations(page, '홈');
    await page.getByRole('link', { name: '검색어를 입력해주세요.' }).click();
    await expect(page).toHaveURL(/\/search$/);

    const input = page.getByRole('textbox', { name: '상품 검색' });
    await input.fill('락토핏');
    await input.press('Enter');

    await expect(page).toHaveURL(/\/search\/results\?q=/);
    const result = page.getByRole('link', {
      name: new RegExp(CATALOG_NAME.replace(/[[\]]/g, '\\$&')),
    });
    await expect(result).toBeVisible();
    await expectNoNewA11yViolations(page, '검색 결과');
    await result.click();

    await expect(page).toHaveURL(/\/products\/1$/);
    // 서버가 그린 기본 데이터 위에 도감 API 응답이 덮였는지(상품명이 API 값으로 바뀜)
    await expect(page.getByText(CATALOG_NAME)).toBeVisible();
    // 진행 중인 뭉치(수요보드) 카드
    await expect(page.getByText('42명 참여')).toBeVisible();
    await expectNoNewA11yViolations(page, '상품 상세');

    expect(backend.requests.map((r) => r.path)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^\/api\/products-search\/search\?q=%EB%9D%BD%ED%86%A0%ED%95%8F/),
        '/api/product-catalog/1',
        '/api/demand-boards/catalog/1?page=0',
      ]),
    );
  });
});
