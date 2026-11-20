import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 900 }, isMobile: false, hasTouch: false });

test('stays a centred 480px shell on desktop', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Sudah punya akun\? Masuk/i }).click();
  await page.getByLabel('Email').fill('fulan@kelana.id');
  await page.getByLabel('Kata Sandi').fill('Password123');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page.getByRole('heading', { name: /Fulan/i })).toBeVisible();

  const nav = page.getByRole('navigation', { name: 'Navigasi utama' });
  const box = await nav.boundingBox();
  expect(Math.round(box?.width ?? 0)).toBe(480);
  expect(Math.round(box?.x ?? 0)).toBe(400);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  await page.screenshot({ path: 'screens/09-desktop.png' });
});