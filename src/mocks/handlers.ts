import { HttpResponse, delay, http } from 'msw';
import type {
  Category,
  Completeness,
  DocumentRecord,
  DocumentType,
  HotelOption,
  MyTrip,
  MyTripDetail,
  Participant,
  Payment,
  PaymentMethod,
  Reservation,
  TripDetail,
  User,
} from '@/lib/types';
import { categories, demoUser, destinations, seedMyTrips, trips } from './data';

const BASE = '/api/v1';

interface StoredReservation {
  reservation: Reservation;
  trip: TripDetail;
  hotel?: HotelOption;
  payment?: Payment;
}

const state = {
  signedIn: false,
  user: null as User | null,
  registrations: new Map<string, { name: string; password: string }>(),
  reservations: new Map<string, StoredReservation>(),
  documents: new Map<string, DocumentRecord>(),
  paymentPolls: new Map<string, number>(),
  myTrips: [] as MyTrip[],
};

state.myTrips = seedMyTrips.map((item) => ({ ...item, trip: { ...item.trip }, schedule: { ...item.schedule } }));

const userFromDemo = (): User => ({
  id: demoUser.id,
  email: demoUser.email,
  name: demoUser.name,
  phone: demoUser.phone,
  role: demoUser.role,
  email_verified_at: demoUser.email_verified_at,
});

const error = (status: number, code: string, message: string, details?: { field: string; message: string }[]) =>
  HttpResponse.json(
    { error: { code, message, ...(details ? { details } : {}) }, request_id: crypto.randomUUID() },
    { status },
  );

const unauthorized = () => error(401, 'UNAUTHORIZED', 'Sesi berakhir. Masuk kembali.');

function authed(request: Request): boolean {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return false;
  state.signedIn = true;
  state.user ??= userFromDemo();
  return true;
}

const envelope = <T,>(data: T) => HttpResponse.json({ data });

function findTripBySchedule(scheduleId: string): { trip: TripDetail; scheduleIndex: number } | null {
  for (const trip of trips) {
    const scheduleIndex = trip.schedules.findIndex((schedule) => schedule.id === scheduleId);
    if (scheduleIndex >= 0) return { trip, scheduleIndex };
  }
  return null;
}

function reservationToMyTrip(stored: StoredReservation): MyTrip {
  const { reservation, trip } = stored;
  return {
    id: reservation.id,
    code: reservation.code,
    status: reservation.status,
    tab:
      reservation.status === 'PAID'
        ? 'SIAP_BERANGKAT'
        : reservation.status === 'COMPLETED'
          ? 'SELESAI'
          : reservation.status === 'CANCELLED' || reservation.status === 'EXPIRED'
            ? 'RIWAYAT'
            : 'BELUM_BAYAR',
    trip: {
      id: trip.id,
      slug: trip.slug,
      title: trip.title,
      category: trip.category,
      departure_city: trip.departure_city,
      destination_city: trip.destination_city,
    },
    schedule: {
      id: trip.schedules[0]?.id ?? '',
      start_date: trip.schedules[0]?.start_date ?? '',
      end_date: trip.schedules[0]?.end_date ?? '',
    },
    participants_count: reservation.participants.length,
    total_amount_idr: reservation.total_amount_idr,
    currency: reservation.currency,
    payment: stored.payment,
    join_wa_url: reservation.status === 'PAID' ? 'https://chat.whatsapp.com/KELANA-demo-group' : undefined,
    timer: reservation.payment_expires_at
      ? { kind: 'PAYMENT', expires_at: reservation.payment_expires_at, remaining_seconds: 0 }
      : undefined,
    created_at: new Date().toISOString(),
  };
}

const vaNumbers: Record<string, string> = {
  VA_BCA: '880812345678',
  VA_BSI: '123456789101',
  VA_MANDIRI: '890912345678',
};

export const handlers = [
  http.post(`${BASE}/auth/register`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string; name: string };
    await delay(240);
    if (!body.email || !body.password || !body.name) {
      return error(422, 'VALIDATION_ERROR', 'Data belum lengkap.', [
        { field: 'email', message: 'Email wajib diisi.' },
      ]);
    }
    state.registrations.set(body.email.toLowerCase(), { name: body.name, password: body.password });
    return HttpResponse.json(
      {
        data: {
          id: crypto.randomUUID(),
          email: body.email,
          name: body.name,
          status: 'PENDING_VERIFICATION',
        },
      },
      { status: 201 },
    );
  }),

  http.post(`${BASE}/auth/verify-email`, async ({ request }) => {
    const body = (await request.json()) as { email: string; code: string };
    await delay(220);
    if (body.code !== '123456') {
      return error(400, 'INVALID_CODE', 'Kode verifikasi salah atau kedaluwarsa.');
    }
    const registered = state.registrations.get(body.email.toLowerCase());
    state.signedIn = true;
    state.user = {
      ...userFromDemo(),
      email: body.email,
      name: registered?.name ?? demoUser.name,
    };
    return envelope({
      access_token: `mock-access-${Date.now()}`,
      expires_in: 900,
      user: state.user,
    });
  }),

  http.post(`${BASE}/auth/resend-verification`, async () => {
    await delay(150);
    return envelope({ message: 'Kode verifikasi dikirim ulang.' });
  }),

  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    await delay(260);
    const registered = state.registrations.get(body.email.toLowerCase());
    const password = registered?.password ?? demoUser.password;
    if (body.email.toLowerCase() !== demoUser.email && !registered) {
      return error(401, 'INVALID_CREDENTIALS', 'Email atau kata sandi salah.');
    }
    if (body.password !== password) {
      return error(401, 'INVALID_CREDENTIALS', 'Email atau kata sandi salah.');
    }
    state.signedIn = true;
    state.user = { ...userFromDemo(), email: body.email, name: registered?.name ?? demoUser.name };
    return envelope({
      access_token: `mock-access-${Date.now()}`,
      expires_in: 900,
      user: state.user,
    });
  }),

  http.post(`${BASE}/auth/refresh`, async () => {
    await delay(120);
    if (!state.signedIn) return unauthorized();
    return envelope({
      access_token: `mock-access-${Date.now()}`,
      expires_in: 900,
      user: state.user ?? userFromDemo(),
    });
  }),

  http.post(`${BASE}/auth/logout`, async () => {
    state.signedIn = false;
    state.user = null;
    return envelope({ message: 'Keluar.' });
  }),

  http.get(`${BASE}/auth/me`, async ({ request }) => {
    if (!authed(request)) return unauthorized();
    return envelope(state.user ?? userFromDemo());
  }),

  http.get(`${BASE}/trips`, async ({ request }) => {
    await delay(180);
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.toLowerCase().trim();
    const category = url.searchParams.get('category') as Category | null;
    const destination = url.searchParams.get('destination')?.toLowerCase().trim();

    let list = trips;
    if (category && category !== ('ALL' as Category)) list = list.filter((trip) => trip.category === category);
    if (destination) list = list.filter((trip) => trip.destination_city.toLowerCase().includes(destination));
    if (q) {
      list = list.filter((trip) =>
        [trip.title, trip.destination_city, trip.departure_city, trip.category]
          .join(' ')
          .toLowerCase()
          .includes(q),
      );
    }

    const data = list.map(({ schedules, itineraries: _i, facilities: _f, hotel_options: _h, description: _d, required_documents: _r, ...card }) => ({
      ...card,
      seats_available: schedules.reduce((total, schedule) => total + schedule.seats_available, 0),
      next_departure: schedules[0]?.start_date,
    }));

    return HttpResponse.json({
      data,
      meta: { page: 1, limit: data.length, total_items: data.length, total_pages: 1 },
    });
  }),

  http.get(`${BASE}/trips/:id`, async ({ params }) => {
    await delay(160);
    const key = String(params.id);
    const trip = trips.find((item) => item.id === key || item.slug === key);
    if (!trip) return error(404, 'NOT_FOUND', 'Trip tidak ditemukan.');
    return envelope(trip);
  }),

  http.get(`${BASE}/trips/:id/schedules`, async ({ params }) => {
    const key = String(params.id);
    const trip = trips.find((item) => item.id === key || item.slug === key);
    if (!trip) return error(404, 'NOT_FOUND', 'Trip tidak ditemukan.');
    return HttpResponse.json({
      data: trip.schedules,
      meta: { page: 1, limit: trip.schedules.length, total_items: trip.schedules.length, total_pages: 1 },
    });
  }),

  http.get(`${BASE}/categories`, async () => {
    await delay(120);
    return HttpResponse.json({ data: categories, meta: { page: 1, limit: 3, total_items: 3, total_pages: 1 } });
  }),

  http.get(`${BASE}/destinations`, async () => {
    await delay(120);
    return HttpResponse.json({ data: destinations, meta: { page: 1, limit: 5, total_items: 5, total_pages: 1 } });
  }),

  http.post(`${BASE}/promos/validate`, async ({ request }) => {
    const body = (await request.json()) as { code: string; subtotal_idr: number };
    await delay(200);
    const valid = body.code.trim().toUpperCase() === 'KELANA2025';
    const discount = valid ? Math.round((body.subtotal_idr * 10) / 100) : 0;
    return envelope({
      valid,
      code: body.code.trim().toUpperCase(),
      discount_idr: discount,
      final_total_idr: body.subtotal_idr - discount,
    });
  }),

  http.post(`${BASE}/reservations/lock`, async ({ request }) => {
    if (!authed(request)) return unauthorized();
    const body = (await request.json()) as {
      schedule_id: string;
      participants: { full_name: string; gender: 'MALE' | 'FEMALE'; phone: string; email: string }[];
      hotel_id?: string;
      pickup_point: string;
      notes?: string;
      promo_code?: string;
    };
    await delay(320);

    const found = findTripBySchedule(body.schedule_id);
    if (!found) return error(404, 'NOT_FOUND', 'Jadwal tidak ditemukan.');
    const { trip, scheduleIndex } = found;
    const schedule = trip.schedules[scheduleIndex]!;

    if (schedule.seats_available < body.participants.length) {
      return error(409, 'QUOTA_FULL', 'Kuota untuk jadwal ini sudah habis.');
    }

    const hotel = trip.hotel_options.find((option) => option.id === body.hotel_id) ?? trip.hotel_options[0];
    const subtotal = schedule.price_idr * body.participants.length + (hotel?.extra_cost_idr ?? 0);
    const promo = body.promo_code?.trim().toUpperCase() === 'KELANA2025';
    const discount = promo ? Math.round((subtotal * 10) / 100) : 0;

    const participants: Participant[] = body.participants.map((participant) => ({
      id: crypto.randomUUID(),
      ...participant,
    }));

    const reservation: Reservation = {
      id: crypto.randomUUID(),
      code: `KLN-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${String(state.reservations.size + 1).padStart(4, '0')}`,
      status: 'PENDING_PAYMENT',
      trip_id: trip.id,
      schedule_id: schedule.id,
      participants,
      unit_price_idr: schedule.price_idr,
      total_amount_idr: subtotal - discount,
      discount_idr: discount,
      currency: 'IDR',
      pickup_point: body.pickup_point,
      notes: body.notes,
      hotel_id: hotel?.id,
      lock_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      seats_remaining: schedule.seats_available - participants.length,
    };

    schedule.seats_available -= participants.length;
    trip.seats_available = (trip.seats_available ?? 0) - participants.length;

    state.reservations.set(reservation.id, { reservation, trip, hotel });
    state.myTrips = [reservationToMyTrip(state.reservations.get(reservation.id)!), ...state.myTrips];

    return HttpResponse.json(
      {
        data: {
          id: reservation.id,
          code: reservation.code,
          status: reservation.status,
          currency: reservation.currency,
          lock_expires_at: reservation.lock_expires_at,
          total_amount_idr: reservation.total_amount_idr,
          discount_idr: reservation.discount_idr,
          seats_remaining: reservation.seats_remaining,
        },
      },
      { status: 201 },
    );
  }),

  http.get(`${BASE}/reservations/:id`, async ({ params, request }) => {
    if (!authed(request)) return unauthorized();
    const stored = state.reservations.get(String(params.id));
    if (!stored) return error(404, 'NOT_FOUND', 'Reservasi tidak ditemukan.');
    return envelope(stored.reservation);
  }),

  http.post(`${BASE}/reservations/:id/cancel`, async ({ params, request }) => {
    if (!authed(request)) return unauthorized();
    const stored = state.reservations.get(String(params.id));
    if (!stored) return error(404, 'NOT_FOUND', 'Reservasi tidak ditemukan.');
    stored.reservation.status = 'CANCELLED';
    const myTrip = state.myTrips.find((item) => item.id === stored.reservation.id);
    if (myTrip) {
      myTrip.status = 'CANCELLED';
      myTrip.tab = 'RIWAYAT';
      myTrip.join_wa_url = undefined;
    }
    return envelope(stored.reservation);
  }),

  http.post(`${BASE}/reservations/:id/payments`, async ({ params, request }) => {
    if (!authed(request)) return unauthorized();
    const stored = state.reservations.get(String(params.id));
    if (!stored) return error(404, 'NOT_FOUND', 'Reservasi tidak ditemukan.');
    const body = (await request.json()) as { method: PaymentMethod };
    await delay(300);

    const payment: Payment = {
      id: crypto.randomUUID(),
      reservation_id: stored.reservation.id,
      provider: 'MOCK',
      method: body.method,
      status: 'PENDING',
      currency: 'IDR',
      amount_idr: stored.reservation.total_amount_idr,
      va_number: vaNumbers[body.method],
      qr_string: body.method === 'QRIS' ? 'KELANA-DEMO-QRIS-PAYLOAD' : undefined,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    };

    stored.payment = payment;
    stored.reservation.payment_expires_at = payment.expires_at;
    const myTrip = state.myTrips.find((item) => item.id === stored.reservation.id);
    if (myTrip) {
      myTrip.payment = payment;
      myTrip.timer = { kind: 'PAYMENT', expires_at: payment.expires_at!, remaining_seconds: 0 };
    }
    state.paymentPolls.set(payment.id, 0);

    return HttpResponse.json({ data: payment }, { status: 201 });
  }),

  // Mock of the provider webhook: the first status read shows PENDING, the
  // second one sees PAID. "Saya Sudah Bayar" polls, exactly like production.
  http.get(`${BASE}/payments/:id`, async ({ params, request }) => {
    if (!authed(request)) return unauthorized();
    const id = String(params.id);
    const seed = seedMyTrips.find((trip) => trip.payment?.id === id)?.payment;
    const stored = [...state.reservations.values()].find((item) => item.payment?.id === id);

    if (!stored && !seed) return error(404, 'NOT_FOUND', 'Pembayaran tidak ditemukan.');

    const payment = stored?.payment ?? seed!;
    const polls = state.paymentPolls.get(id) ?? 0;

    if (payment.status === 'PENDING' && polls >= 1) {
      payment.status = 'PAID';
      payment.paid_at = new Date().toISOString();
      if (stored) {
        stored.reservation.status = 'PAID';
        const myTrip = state.myTrips.find((item) => item.id === stored.reservation.id);
        if (myTrip) {
          myTrip.status = 'PAID';
          myTrip.tab = 'SIAP_BERANGKAT';
          myTrip.payment = { ...payment };
          myTrip.join_wa_url = 'https://chat.whatsapp.com/KELANA-demo-group';
        }
      }
    }
    state.paymentPolls.set(id, polls + 1);

    return envelope(payment);
  }),

  http.post(`${BASE}/documents`, async ({ request }) => {
    if (!authed(request)) return unauthorized();
    const form = await request.formData();
    const file = form.get('file');
    const type = form.get('type') as DocumentType | null;
    const participantId = form.get('participant_id');
    await delay(400);

    if (!(file instanceof File) || !type || !participantId) {
      return error(422, 'VALIDATION_ERROR', 'Dokumen tidak lengkap.');
    }
    if (file.size > 3 * 1024 * 1024) {
      return error(413, 'FILE_TOO_LARGE', 'Ukuran dokumen melebihi 3 MB.');
    }
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      return error(415, 'UNSUPPORTED_MEDIA_TYPE', 'Hanya JPEG, PNG, atau PDF.');
    }

    const stored = [...state.reservations.values()].find((item) =>
      item.reservation.participants.some((participant) => participant.id === String(participantId)),
    );
    if (!stored) return error(404, 'NOT_FOUND', 'Reservasi tidak ditemukan.');

    const record: DocumentRecord = {
      id: crypto.randomUUID(),
      reservation_id: stored.reservation.id,
      participant_id: String(participantId),
      type,
      size_bytes: file.size,
      status: 'UPLOADED',
      created_at: new Date().toISOString(),
    };
    state.documents.set(record.id, record);
    return HttpResponse.json({ data: record }, { status: 201 });
  }),

  http.delete(`${BASE}/documents/:id`, async ({ params, request }) => {
    if (!authed(request)) return unauthorized();
    state.documents.delete(String(params.id));
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${BASE}/reservations/:id/documents/completeness`, async ({ params, request }) => {
    if (!authed(request)) return unauthorized();
    const stored = state.reservations.get(String(params.id));
    if (!stored) return error(404, 'NOT_FOUND', 'Reservasi tidak ditemukan.');

    const required = stored.trip.required_documents;
    const docs = [...state.documents.values()].filter((doc) => doc.reservation_id === stored.reservation.id);
    const participants = stored.reservation.participants.map((participant) => {
      const uploaded = docs.filter((doc) => doc.participant_id === participant.id).map((doc) => doc.type);
      return {
        participant_id: participant.id,
        full_name: participant.full_name,
        uploaded,
        missing: required.filter((type) => !uploaded.includes(type as DocumentType)),
      };
    });

    const payload: Completeness = {
      reservation_id: stored.reservation.id,
      required_documents: required,
      complete: participants.every((participant) => participant.missing.length === 0),
      participants,
    };
    return envelope(payload);
  }),

  http.get(`${BASE}/mytrips`, async ({ request }) => {
    if (!authed(request)) return unauthorized();
    await delay(200);
    const url = new URL(request.url);
    const tab = url.searchParams.get('tab');
    const data = tab ? state.myTrips.filter((item) => item.tab === tab) : state.myTrips;
    return HttpResponse.json({
      data,
      meta: { page: 1, limit: 20, total_items: data.length, total_pages: 1 },
    });
  }),

  http.get(`${BASE}/mytrips/:id`, async ({ params, request }) => {
    if (!authed(request)) return unauthorized();
    const myTrip = state.myTrips.find((item) => item.id === String(params.id));
    if (!myTrip) return error(404, 'NOT_FOUND', 'Trip tidak ditemukan.');
    const stored = state.reservations.get(myTrip.id);
    const detail: MyTripDetail = {
      ...myTrip,
      participants: stored?.reservation.participants ?? [],
      documents: stored ? [...state.documents.values()].filter((doc) => doc.reservation_id === stored.reservation.id) : [],
      discount_idr: stored?.reservation.discount_idr ?? 0,
      pickup_point: stored?.reservation.pickup_point ?? '-',
      notes: stored?.reservation.notes,
      lock_expires_at: stored?.reservation.lock_expires_at,
      payment_expires_at: stored?.reservation.payment_expires_at,
      paid_at: myTrip.payment?.paid_at,
    };
    return envelope(detail);
  }),

  http.post(`${BASE}/mytrips/:id/cancel`, async ({ params, request }) => {
    if (!authed(request)) return unauthorized();
    const myTrip = state.myTrips.find((item) => item.id === String(params.id));
    if (!myTrip) return error(404, 'NOT_FOUND', 'Trip tidak ditemukan.');
    if (myTrip.status === 'PAID' || myTrip.status === 'COMPLETED') {
      return error(409, 'NOT_CANCELLABLE', 'Trip yang sudah dibayar tidak bisa dibatalkan dari sini.');
    }
    myTrip.status = 'CANCELLED';
    myTrip.tab = 'RIWAYAT';
    myTrip.join_wa_url = undefined;
    const stored = state.reservations.get(myTrip.id);
    if (stored) stored.reservation.status = 'CANCELLED';
    return envelope(myTrip);
  }),
];