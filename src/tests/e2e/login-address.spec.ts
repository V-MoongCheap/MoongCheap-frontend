import { E2E_MEMBER, expect, expectNoNewA11yViolations, test } from './support/fixtures';

/**
 * 다음(Daum) 우편번호 팝업 대체. 실제 팝업은 외부 창이라 자동화하지 않고, 사용자가 주소 하나를
 * 고른 것과 같은 결과를 바로 돌려준다. 페이지가 열리기 전에 심어 두면 앱은 스크립트를 내려받지 않는다.
 */
async function stubDaumPostcode(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    type Options = { oncomplete: (data: unknown) => void; onclose?: () => void };
    (window as unknown as { daum: unknown }).daum = {
      Postcode: class {
        constructor(private readonly options: Options) {}
        open() {
          this.options.oncomplete({
            zonecode: '06236',
            roadAddress: '서울 강남구 테헤란로 123',
            jibunAddress: '서울 강남구 역삼동 123-4',
            userSelectedType: 'R',
            bname: '역삼동',
            apartment: 'N',
            buildingName: '',
          });
          this.options.onclose?.();
        }
      },
    };
  });
}

test.describe('로그인 → 마이페이지 → 배송지 등록', () => {
  test('아이디로 로그인하고 첫 배송지를 등록하면 기본 배송지로 목록에 나타난다', async ({
    page,
    backend,
  }) => {
    await stubDaumPostcode(page);

    // 1. 로그인
    await page.goto('/login');
    await expectNoNewA11yViolations(page, '로그인');
    await page.getByPlaceholder('아이디를 입력해주세요.').fill(E2E_MEMBER.loginId);
    await page.getByPlaceholder('비밀번호를 입력해주세요.').fill(E2E_MEMBER.password);
    await page.getByRole('button', { name: '로그인', exact: true }).click();
    await expect(page).toHaveURL(/\/$/);

    // 2. 하단 탭 MY → 배송지 관리
    await page.getByRole('link', { name: 'MY' }).click();
    await expect(page).toHaveURL(/\/mypage$/);
    await page.getByRole('link', { name: '배송지 관리' }).click();
    await expect(page).toHaveURL(/\/mypage\/addresses$/);

    // 3. 빈 목록 → 신규 배송지 추가
    await page.getByRole('link', { name: '신규 배송지 추가' }).click();
    await expect(page).toHaveURL(/\/mypage\/addresses\/new$/);

    const submit = page.getByRole('button', { name: '확인' });
    await expect(submit).toBeDisabled();

    await page.getByRole('button', { name: '우편번호 찾기' }).click();
    await expect(page.getByRole('textbox', { name: '우편번호' })).toHaveValue('06236');
    await expect(page.getByRole('textbox', { name: '주소', exact: true })).toHaveValue(
      '서울 강남구 테헤란로 123 (역삼동)',
    );
    await page.getByRole('textbox', { name: '상세주소' }).fill('101동 1001호');
    await page.getByRole('textbox', { name: '공동현관 출입번호' }).fill('#1234');
    await page.getByRole('textbox', { name: '배송지명' }).fill('회사');
    await page.getByRole('textbox', { name: '받는 분' }).fill('홍길동');
    await page.getByRole('textbox', { name: '휴대폰 번호' }).fill('01012345678');
    await expectNoNewA11yViolations(page, '배송지 등록 폼');

    await expect(submit).toBeEnabled();
    await submit.click();

    // 4. 목록으로 돌아와 방금 등록한 배송지가 기본으로 보인다
    await expect(page).toHaveURL(/\/mypage\/addresses$/);
    await expect(page.getByText('회사')).toBeVisible();
    await expect(page.getByText('홍길동')).toBeVisible();
    await expect(page.getByText('기본배송지')).toBeVisible();
    await expectNoNewA11yViolations(page, '배송지 목록');

    // 앱이 보낸 등록 요청이 폼 값과 일치한다
    const created = backend.requests.find(
      (r) => r.method === 'POST' && r.path === '/api/shipping-addresses',
    );
    expect(created?.body).toMatchObject({
      alias: '회사',
      recipientName: '홍길동',
      phoneNumber: '01012345678',
      zipcode: '06236',
      address: '서울 강남구 테헤란로 123 (역삼동)',
      addressDetail: '101동 1001호',
      entranceCode: '#1234',
    });
  });

  test('비밀번호가 틀리면 로그인되지 않고 안내 문구가 보인다', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('아이디를 입력해주세요.').fill(E2E_MEMBER.loginId);
    await page.getByPlaceholder('비밀번호를 입력해주세요.').fill('Wrong-pass1!');
    await page.getByRole('button', { name: '로그인', exact: true }).click();

    await expect(page.getByText('아이디 또는 비밀번호가 일치하지 않습니다.')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});
