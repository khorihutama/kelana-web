import { expect, test } from '@playwright/test';

const DISABLED_BG = 'rgb(166, 176, 194)'; // #a6b0c2

test.describe('auth submit gating', () => {
  test('Daftar stays disabled until every field and the terms box are valid', async ({ page }) => {
    await page.goto('/signup');
    const submit = page.getByRole('button', { name: 'Daftar', exact: true });

    await expect(submit).toBeDisabled();
    expect(await submit.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(DISABLED_BG);

    await page.getByLabel('Nama Lengkap').fill('Fulan bin Fulan');
    await page.getByLabel('Email').fill('fulan@hsigo.id');
    await page.getByLabel('Kata Sandi', { exact: true }).fill('Password123');
    await page.getByLabel('Ulangi Kata Sandi').fill('Password123');

    // Everything except the terms checkbox.
    await expect(submit).toBeDisabled();
    expect(await submit.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(DISABLED_BG);

    // Enter must not submit while the button is disabled.
    await page.getByLabel('Nama Lengkap').press('Enter');
    await expect(page).toHaveURL(/\/signup$/);

    await page.getByText(/Saya sudah membaca dan menyetujui/).click();
    await expect(page.getByRole('checkbox')).toBeChecked();
    await expect(submit).toBeEnabled();
    expect(await submit.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe(DISABLED_BG);

    await expect(page.getByText(/Invalid literal value/i)).toHaveCount(0);
  });

  test('Masuk stays disabled until the email and password are valid', async ({ page }) => {
    await page.goto('/signin');
    const submit = page.getByRole('button', { name: 'Masuk', exact: true });

    await expect(submit).toBeDisabled();
    expect(await submit.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(DISABLED_BG);

    await page.getByLabel('Email').fill('fulan@hsigo.id');
    await expect(submit).toBeDisabled();

    await page.getByLabel('Kata Sandi').fill('Password123');
    await expect(submit).toBeEnabled();
    expect(await submit.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe(DISABLED_BG);

    await expect(page.getByText(/Invalid literal value/i)).toHaveCount(0);
  });
});