import { expect, test, type Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const KTP = fileURLToPath(new URL('./fixtures/ktp.pdf', import.meta.url));

async function signIn(page: Page) {
  await page.goto('/');
  await expect(page).toHaveURL(/\/welcome$/);
  await page.getByRole('link', { name: /Sudah punya akun\? Masuk/i }).click();
  await page.getByLabel('Email').fill('fulan@kelana.id');
  await page.getByLabel('Kata Sandi').fill('Password123');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page.getByRole('heading', { name: /Fulan/i })).toBeVisible();
}

test('main flow: auth -> home -> detail -> reservation -> payment -> success -> tripku', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await signIn(page);

  // Home -> search
  await page.getByRole('button', { name: /Mau ke mana/i }).click();
  await expect(page).toHaveURL(/\/search/);
  await page.getByLabel('Kata kunci pencarian').fill('jogja');
  await expect(page.getByText(/\d+ Hasil Pencarian/)).toBeVisible();
  await page.getByTestId('trip-card').first().click();

  // Detail
  await expect(page.getByRole('heading', { name: /Jogja Dieng/i })).toBeVisible();
  await page.getByRole('button', { name: 'Pesan Sekarang' }).click();
  await page.getByRole('button', { name: 'Lanjutkan' }).click();
  await expect(page.getByText(/Selesaikan Reservasi dalam waktu 15 Menit/i)).toBeVisible();
  await page.getByRole('button', { name: 'Lanjutkan' }).click();

  // Reservation
  await expect(page.getByRole('heading', { name: 'Reservasi' })).toBeVisible();
  await page.getByRole('button', { name: 'Tambah peserta' }).click();
  await page.getByLabel('Nama Lengkap').fill('Fulan bin Fulan');
  await page.getByLabel('Nomor Telepon').fill('+6281234567890');
  await page.getByLabel('Email').fill('fulan@kelana.id');
  await page.getByRole('button', { name: 'Simpan Data' }).click();
  await expect(page.getByText(/Peserta 1/)).toBeVisible();

  await page.getByLabel('Titik Penjemputan').fill('Stasiun Tugu');
  await page.getByRole('button', { name: 'Kunci Kursi & Lanjutkan' }).click();

  // The lock exists: documents unlock and the timer starts from the server.
  await expect(page.getByRole('timer')).toBeVisible();
  await expect(page.getByText('Dokumen Pendukung')).toBeVisible();

  const fileInputs = page.locator('input[type="file"]');
  await expect(fileInputs).toHaveCount(2);
  // Each upload replaces its input with an UploadItem, so always take the first.
  for (let index = 0; index < 2; index += 1) {
    await page.locator('input[type="file"]').first().setInputFiles(KTP);
    await expect(page.locator('input[type="file"]')).toHaveCount(1 - index);
  }
  await expect(page.getByText('Lengkap').first()).toBeVisible();

  await page.getByRole('button', { name: 'Pilih Pembayaran' }).click();

  // Payment method -> VA -> success
  await expect(page.getByRole('heading', { name: 'Metode Pembayaran' })).toBeVisible();
  await page.getByRole('button', { name: 'Bayar Sekarang' }).click();
  await expect(page.getByRole('heading', { name: 'Detail Pembayaran' })).toBeVisible();
  await expect(page.getByText('8808 1234 5678')).toBeVisible();
  await page.getByRole('button', { name: 'Saya Sudah Bayar' }).click();
  await expect(page.getByRole('heading', { name: /Pembayaran Berhasil/i })).toBeVisible({ timeout: 30_000 });

  await page.getByRole('button', { name: 'Menuju Halaman Tripku' }).click();
  await expect(page.getByRole('heading', { name: 'Tripku' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Gabung Grup WA/i }).first()).toBeVisible();

  expect(consoleErrors.filter((text) => !text.includes('favicon'))).toEqual([]);
});

test('a pending trip never shows the WhatsApp button', async ({ page }) => {
  await signIn(page);
  await page.getByTestId('tab-tripku').click();
  await expect(page.getByRole('heading', { name: 'Tripku' })).toBeVisible();
  await expect(page.getByText('Menunggu Pembayaran').first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Gabung Grup WA/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Bayar Sekarang' }).first()).toBeVisible();
});

test('empty search shows the empty state', async ({ page }) => {
  await signIn(page);
  await page.goto('/search?q=zzzz');
  await expect(page.getByText('Tidak ada hasil')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reset pencarian' })).toBeVisible();
});