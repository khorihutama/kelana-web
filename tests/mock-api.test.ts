import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from '@/mocks/handlers';

const server = setupServer(...handlers);
const base = `${window.location.origin}/api/v1`;
const token = 'mock-access-test';
const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());

async function json<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

describe('mock API matches the OpenAPI contract', () => {
  it('registers, verifies the OTP and returns tokens', async () => {
    const register = await fetch(`${base}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Uji Coba', email: 'uji@kelana.id', password: 'Password123' }),
    });
    expect(register.status).toBe(201);
    const created = await json<{ data: { status: string } }>(register);
    expect(created.data.status).toBe('PENDING_VERIFICATION');

    const wrong = await fetch(`${base}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'uji@kelana.id', code: '000000' }),
    });
    expect(wrong.status).toBe(400);

    const verify = await fetch(`${base}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'uji@kelana.id', code: '123456' }),
    });
    expect(verify.status).toBe(200);
    const verified = await json<{ data: { access_token: string; user: { email: string } } }>(verify);
    expect(verified.data.access_token).toMatch(/^mock-access-/);
    expect(verified.data.user.email).toBe('uji@kelana.id');
  });

  it('rejects a wrong password with 401', async () => {
    const response = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'fulan@kelana.id', password: 'salah' }),
    });
    expect(response.status).toBe(401);
    const payload = await json<{ error: { code: string } }>(response);
    expect(payload.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('locks seats, creates a VA and flips to PAID on the status check', async () => {
    const trips = await json<{ data: { slug: string }[] }>(await fetch(`${base}/trips`));
    expect(trips.data.length).toBeGreaterThan(5);

    const participants = [
      { full_name: 'Fulan bin Fulan', gender: 'MALE', phone: '+6281234567890', email: 'fulan@kelana.id' },
      { full_name: 'Fulanah binti Fulan', gender: 'FEMALE', phone: '+6281234567891', email: 'fulanah@kelana.id' },
    ];

    const lock = await fetch(`${base}/reservations/lock`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({
        schedule_id: 's-jogja-1',
        participants,
        hotel_id: 'h-jogja-b',
        pickup_point: 'Stasiun Tugu',
        promo_code: 'KELANA2025',
      }),
    });
    expect(lock.status).toBe(201);
    const locked = await json<{ data: { id: string; total_amount_idr: number; discount_idr: number } }>(lock);
    // 2 x 850.000 + 150.000 hotel - 10% promo = 1.700.000 + 150.000 - 185.000
    expect(locked.data.total_amount_idr).toBe(1665000);
    expect(locked.data.discount_idr).toBe(185000);

    const paymentResponse = await fetch(`${base}/reservations/${locked.data.id}/payments`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ method: 'VA_BCA' }),
    });
    expect(paymentResponse.status).toBe(201);
    const payment = await json<{ data: { id: string; status: string; va_number: string } }>(paymentResponse);
    expect(payment.data.status).toBe('PENDING');
    expect(payment.data.va_number).toBe('880812345678');

    const firstPoll = await json<{ data: { status: string } }>(
      await fetch(`${base}/payments/${payment.data.id}`, { headers: auth }),
    );
    expect(firstPoll.data.status).toBe('PENDING');

    const secondPoll = await json<{ data: { status: string; paid_at?: string } }>(
      await fetch(`${base}/payments/${payment.data.id}`, { headers: auth }),
    );
    expect(secondPoll.data.status).toBe('PAID');
    expect(secondPoll.data.paid_at).toBeTruthy();

    const tripsAfter = await json<{ data: { code: string; join_wa_url?: string }[] }>(
      await fetch(`${base}/mytrips?tab=SIAP_BERANGKAT`, { headers: auth }),
    );
    expect(tripsAfter.data.some((item) => Boolean(item.join_wa_url))).toBe(true);
  });

  it('refuses a lock when the schedule has no seats', async () => {
    const response = await fetch(`${base}/reservations/lock`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({
        schedule_id: 's-pantai-1',
        participants: [{ full_name: 'A', gender: 'MALE', phone: '+6281234567890', email: 'a@b.co' }],
        pickup_point: 'Alun-alun',
      }),
    });
    expect(response.status).toBe(409);
    const payload = await json<{ error: { code: string } }>(response);
    expect(payload.error.code).toBe('QUOTA_FULL');
  });

  it('keeps the WhatsApp link only on paid trips', async () => {
    const pending = await json<{ data: { join_wa_url?: string }[] }>(
      await fetch(`${base}/mytrips?tab=BELUM_BAYAR`, { headers: auth }),
    );
    expect(pending.data.length).toBeGreaterThan(0);
    expect(pending.data.every((item) => !item.join_wa_url)).toBe(true);
  });
});