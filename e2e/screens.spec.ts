import { expect, test } from '@playwright/test';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const KTP = fileURLToPath(new URL('./fixtures/ktp.pdf', import.meta.url));
const OUT = path.join(process.cwd(), 'screens');

test('capture the key screens at 390x844', async ({ page }) => {
  await mkdir(OUT, { recursive: true });

  await page.goto('/');
  await page.getByRole('link', { name: /Sudah punya akun\? Masuk/i }).click();
  await page.getByLabel('Email').fill('fulan@hsigo.id');
  await page.getByLabel('Kata sandi').fill('Password123').catch(async () => {
    await page.getByLabel('Kata Sandi').fill('Password123');
  });
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page.getByRole('heading', { name: /Fulan/i })).toBeVisible();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, '01-home.png') });

  await page.getByRole('button', { name: /Mau ke mana/i }).click();
  await page.getByLabel('Kata kunci pencarian').fill('jogja');
  await expect(page.getByText(/Hasil Pencarian/)).toBeVisible();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, '02-search.png') });

  await page.getByTestId('trip-card').first().click();
  await expect(page.getByRole('heading', { name: /Jogja Dieng/i })).toBeVisible();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, '03-detail.png') });

  await page.getByRole('button', { name: 'Pesan Sekarang' }).click();
  await page.getByRole('button', { name: 'Lanjutkan' }).click();
  await page.getByRole('button', { name: 'Lanjutkan' }).click();
  await page.getByRole('button', { name: 'Tambah peserta' }).click();
  await page.getByLabel('Nama Lengkap').fill('Fulan bin Fulan');
  await page.getByLabel('Nomor Telepon').fill('+6281234567890');
  await page.getByLabel('Email').fill('fulan@hsigo.id');
  await page.getByRole('button', { name: 'Simpan Data' }).click();
  await page.getByLabel('Titik Penjemputan').fill('Stasiun Tugu');
  await page.getByRole('button', { name: 'Kunci Kursi & Lanjutkan' }).click();
  await expect(page.getByRole('timer')).toBeVisible();

  for (let index = 0; index < 2; index += 1) {
    await page.locator('input[type="file"]').first().setInputFiles(KTP);
    await expect(page.locator('input[type="file"]')).toHaveCount(1 - index);
  }
  await expect(page.getByText('Lengkap').first()).toBeVisible();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, '04-reservation.png') });

  await page.getByRole('button', { name: 'Pilih Pembayaran' }).click();
  await expect(page.getByRole('heading', { name: 'Metode Pembayaran' })).toBeVisible();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, '05-payment-method.png') });

  await page.getByRole('button', { name: 'Bayar Sekarang' }).click();
  await expect(page.getByRole('heading', { name: 'Detail Pembayaran' })).toBeVisible();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, '06-payment-detail.png') });

  await page.getByRole('button', { name: 'Saya Sudah Bayar' }).click();
  await expect(page.getByRole('heading', { name: /Pembayaran Berhasil/i })).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, '07-success.png') });

  await page.getByRole('button', { name: 'Menuju Halaman Tripku' }).click();
  await expect(page.getByRole('heading', { name: 'Tripku' })).toBeVisible();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, '08-tripku.png') });
});