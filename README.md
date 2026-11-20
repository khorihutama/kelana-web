# Kelana – Web (React + TanStack)

Repo: [khorihutama/kelana-web](https://github.com/khorihutama/kelana-web) · API: [khorihutama/kelana-api](https://github.com/khorihutama/kelana-api)

Mobile-first PWA untuk Kelana: discovery trip, detail, reservasi dengan lock 15 menit, unggah dokumen,
pembayaran VA/QRIS/kartu, dan Tripku. Dibangun dari PRD, inventaris 45 layar Figma, dan kontrak
[kelana-api/internal/api/openapi.json](https://github.com/khorihutama/kelana-api/blob/main/internal/api/openapi.json) (29 path).

## Jalankan

```bash
git clone https://github.com/khorihutama/kelana-web.git
cd kelana-web
pnpm install
pnpm dev            # http://127.0.0.1:5173, mode mock (MSW)
```

Build produksi dan pratinjau:

```bash
pnpm build
pnpm preview
```

Mode nyata (butuh backend di `http://localhost:8080`):

```bash
VITE_API_MODE=real VITE_API_BASE=http://localhost:8080/api/v1 pnpm dev
```

Mock adalah default (`VITE_API_MODE` kosong = `mock`), jadi aplikasi tetap jalan tanpa backend.
Akun demo hanya ada di mode mock dan didefinisikan di `src/mocks/data.ts`; staging dan production tidak
menyediakan akun demo yang di-seed, jadi daftar akun baru lewat alur OTP.

## Verifikasi

```bash
pnpm typecheck     # tsc, strict + noUncheckedIndexedAccess
pnpm lint
pnpm test          # Vitest: format, validasi, komponen, kontrak mock API
pnpm e2e           # Playwright 390x844: alur penuh, WA gate, empty search, desktop
pnpm screens       # Playwright mencetak 9 PNG ke screens/ (butuh `pnpm exec playwright install chromium`)
```

Screenshot memuat countdown dan waktu live, jadi byte PNG bisa berbeda antar-run; itu normal.

## Struktur

```
src/routes/        halaman per layar (auth, home, destinasi, search, trip, booking, checkout, pay, success, mytrips, profile)
src/components/    design system: tombol, field, modal, toast, timer, kartu trip, shell + tab bar
src/lib/           tipe dari OpenAPI, klien api (refresh 401), format rupiah/tanggal, validasi zod, sesi
src/mocks/         MSW handlers + data demo
src/queries.ts     hook TanStack Query dan mutation
```

Token disimpan di `localStorage` (`kelana.session`) untuk demo; backend asli mengirim refresh token
sebagai cookie HttpOnly, dan klien sudah memanggil `/auth/refresh` dengan `credentials: 'include'`
saat menerima 401.

## Kontrak API

| Endpoint | Dipakai | Catatan |
| --- | --- | --- |
| `POST /auth/register`, `/auth/verify-email`, `/auth/resend-verification`, `/auth/login`, `/auth/refresh`, `/auth/logout` | ya | OTP 6 digit, resend cooldown 15 detik |
| `GET /auth/me` | ya | menyegarkan profil |
| `GET /trips` (`q`, `category`, `limit`) | ya | pencarian + filter kategori |
| `GET /trips/{id}` | ya | detail termasuk `schedules`, `hotel_options`, `itineraries` |
| `GET /categories` | ya | kartu kategori di Home |
| `POST /reservations/lock` | ya | 409 `QUOTA_FULL` ditangani sebagai toast + balik ke detail |
| `GET /reservations/{id}` | ya | sumber `lock_expires_at` untuk timer |
| `POST /reservations/{id}/payments` | ya | `Idempotency-Key` acak per klik |
| `GET /payments/{id}` | ya | polling "Saya Sudah Bayar" (webhook yang mengubah status) |
| `POST /promos/validate` | ya | `KELANA2025` = diskon 10% |
| `POST /documents`, `DELETE /documents/{id}`, `GET /reservations/{id}/documents/completeness` | ya | unggah XHR dengan progres, batas 3 MB |
| `GET /mytrips`, `POST /mytrips/{id}/cancel` | ya | tab Belum Bayar / Siap Berangkat / Selesai / Riwayat |
| `GET /trips/{id}/schedules` | tidak | jadwal sudah ikut di detail trip |
| `GET /mytrips/{id}` | tidak | daftar sudah memuat yang dibutuhkan kartu |
| `GET /destinations` | tidak | chip destinasi belum dipakai |
| `POST /reservations/{id}/cancel` | tidak | pembatalan lewat `/mytrips/{id}/cancel` |
| `GET /documents/{id}/url`, `/content` | tidak | pratinjau dokumen tidak ada di desain |
| `POST /payments/webhook/{provider}`, `/healthz`, `/readyz` | tidak | sisi server |

## Deviasi dari desain (disengaja)

1. **Timer 15 menit.** Desain menyalakan timer saat pop-up reservasi dibuka. API mewajibkan
   `schedule_id`, `participants[]`, dan `pickup_point` untuk membuat lock, jadi kursi baru benar-benar
   terkunci saat tombol **Kunci Kursi & Lanjutkan** ditekan; timer di layar memakai `lock_expires_at`
   dari server, bukan hitungan lokal.
2. **Dokumen diunggah setelah lock.** `POST /documents` membutuhkan `participant_id` dari server,
   sehingga unggah KTP/Buku Nikah/KK muncul di halaman reservasi setelah lock, lalu
   `/documents/completeness` menjadi gerbang tombol pembayaran.
3. **Kategori "Alam"** tidak ada di enum API (`OPEN`/`PRIVATE`/`EDU`). Chip Alam adalah filter UI atas
   destinasi alam pada katalog ini (Bromo, Dieng, Ijen, Malang Selatan, Ciwidey).
4. **Gambar hero** memakai gradasi generatip per slug; tidak ada aset foto di repo desain maupun Figma
   yang boleh diunduh ulang.
5. **Pemilih bahasa** di Get Started tersimpan sebagai preferensi tampilan; salinan English belum ada.
6. **Menu profil** selain Log Out ditandai "Segera" karena tidak ada endpoint pendukung.

## Celah yang belum tertutup

- Integrasi backend nyata belum diuji: Docker daemon tidak hidup di mesin ini, jadi semua verifikasi
  memakai MSW dengan kontrak yang sama.
- PWA memakai manifest + meta; belum ada service worker offline (di mode mock, MSW mendaftarkan
  service worker-nya sendiri).
- Kartu kredit hanya memilih metode; belum ada halaman penyedia/3DS karena tidak ada di kontrak.
- Uji perangkat: hanya Chromium 390x844 dan 1280x900.