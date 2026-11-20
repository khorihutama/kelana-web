import { expect, test, type Page } from '@playwright/test';

const VIEWPORTS = [
  { label: '390x844', width: 390, height: 844 },
  { label: '320x700', width: 320, height: 700 },
  { label: '1280x800', width: 1280, height: 800 },
];

async function signIn(page: Page) {
  await page.goto('/');
  await page.getByRole('link', { name: /Sudah punya akun\? Masuk/i }).click();
  await page.getByLabel('Email').fill('fulan@kelana.id');
  await page.getByLabel('Kata Sandi').fill('Password123');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page.getByRole('heading', { name: /Fulan/i })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test('#1 the trip price is never truncated or covered by the CTA', async ({ page }) => {
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport);
    await page.goto('/trips/bromo-private');
    const price = page.getByTestId('trip-price');
    await expect(price).toHaveText('Rp 3.500.000');

    const metrics = await price.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(metrics.scrollWidth, `${viewport.label}: price clipped`).toBeLessThanOrEqual(metrics.clientWidth + 1);

    const cta = page.getByRole('button', { name: 'Pesan Sekarang' });
    const [priceBox, ctaBox] = await Promise.all([price.boundingBox(), cta.boundingBox()]);
    expect(priceBox).not.toBeNull();
    expect(ctaBox).not.toBeNull();
    expect(priceBox!.x + priceBox!.width, `${viewport.label}: price overlaps CTA`).toBeLessThanOrEqual(ctaBox!.x + 0.5);
  }
});

test('#2 the lock CTA stays disabled until one participant is added', async ({ page }) => {
  await page.setViewportSize(VIEWPORTS[0]!);
  await page.goto('/booking/jogja-dieng');
  const cta = page.getByRole('button', { name: 'Kunci Kursi & Lanjutkan' });

  await expect(cta).toBeDisabled();
  await expect(page.getByText('Rp 0', { exact: true }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Tambah peserta' }).click();
  await expect(cta).toBeEnabled();
});

test('#3 the destinations page only offers categories the API returns', async ({ page }) => {
  await page.setViewportSize(VIEWPORTS[0]!);
  await page.goto('/destinations');
  await expect(page.getByRole('link', { name: 'Alam', exact: true })).toHaveCount(0);

  // A stale ALAM link falls back to all trips instead of an empty catalogue.
  await page.goto('/destinations?category=ALAM');
  await expect(page.getByTestId('trip-card').first()).toBeVisible();
  await expect(page.getByText('Belum ada trip di kategori ini')).toHaveCount(0);
});

test('#4 the content is a centred 480px shell from 320px to 1280px', async ({ page }) => {
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport);
    for (const path of ['/home', '/destinations']) {
      await page.goto(path);
      const shell = page.getByTestId('tab-screen');
      await expect(shell).toBeVisible();
      const box = await shell.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width, `${viewport.label} ${path}: shell width`).toBeLessThanOrEqual(480.5);
      expect(box!.width, `${viewport.label} ${path}: shell uses the viewport`).toBeGreaterThanOrEqual(
        Math.min(viewport.width, 480) - 0.5,
      );
      expect(
        Math.abs(box!.x - (viewport.width - box!.width) / 2),
        `${viewport.label} ${path}: shell not centred`,
      ).toBeLessThanOrEqual(1);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${viewport.label} ${path}: horizontal overflow`).toBeLessThanOrEqual(0);
    }
  }
});

test('#5 the tab bar is fixed on mobile and static on desktop so it never covers content', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  for (const path of ['/home', '/destinations', '/mytrips']) {
    await page.goto(path);
    const nav = page.getByRole('navigation', { name: 'Navigasi utama' });
    await expect(nav).toBeVisible();
    expect(await nav.evaluate((element) => getComputedStyle(element).position), `${path}: desktop nav position`).toBe(
      'static',
    );

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const gap = await nav.evaluate((element) => {
      const previous = element.previousElementSibling;
      if (!previous) return 0;
      return element.getBoundingClientRect().top - previous.getBoundingClientRect().bottom;
    });
    expect(gap, `${path}: nav overlaps the content above it`).toBeGreaterThanOrEqual(-0.5);
  }

  await page.setViewportSize(VIEWPORTS[0]!);
  for (const path of ['/home', '/destinations', '/mytrips']) {
    await page.goto(path);
    const nav = page.getByRole('navigation', { name: 'Navigasi utama' });
    expect(await nav.evaluate((element) => getComputedStyle(element).position), `${path}: mobile nav position`).toBe(
      'fixed',
    );
    const [navBox, paddingBottom] = await Promise.all([
      nav.boundingBox(),
      page.getByTestId('tab-screen').evaluate((element) => parseFloat(getComputedStyle(element).paddingBottom)),
    ]);
    expect(navBox).not.toBeNull();
    expect(paddingBottom, `${path}: content lacks room for the fixed nav`).toBeGreaterThanOrEqual(navBox!.height);
  }
});

test('#6 the hotel section is hidden when a trip has no hotel options', async ({ page }) => {
  await page.setViewportSize(VIEWPORTS[0]!);
  await page.goto('/booking/kawah-ijen');
  await expect(page.getByText('Jumlah Peserta', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pilihan Hotel' })).toHaveCount(0);
  await expect(page.getByText('Titik Penjemputan')).toBeVisible();

  await page.goto('/booking/jogja-dieng');
  await expect(page.getByRole('heading', { name: 'Pilihan Hotel' })).toBeVisible();
  await expect(page.getByText('Hotel Dieng A')).toBeVisible();
});