import { session } from './session';
import type {
  AuthResponse,
  CategoryCount,
  Completeness,
  DestinationCount,
  DocumentRecord,
  DocumentType,
  Envelope,
  ListEnvelope,
  LockRequest,
  LockResponse,
  MyTrip,
  MyTripDetail,
  MyTripTab,
  ParticipantInput,
  Payment,
  PaymentMethod,
  PromoValidation,
  Reservation,
  TripCard,
  TripDetail,
  User,
} from './types';

export const API_BASE: string = import.meta.env.VITE_API_BASE ?? '/api/v1';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: { field: string; message: string }[];
  readonly requestId?: string;
  readonly retryAfterSeconds?: number;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: { field: string; message: string }[],
    requestId?: string,
    retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
    this.retryAfterSeconds = retryAfterSeconds;
  }

  fieldError(field: string): string | undefined {
    return this.details?.find((detail) => detail.field === field)?.message;
  }
}

export function rateLimitWaitMessage(error: unknown): string | undefined {
  if (!(error instanceof ApiError) || error.status !== 429) return undefined;
  const seconds = error.retryAfterSeconds;
  if (!seconds || seconds <= 0) return 'Terlalu banyak percobaan. Coba lagi nanti.';
  if (seconds < 60) return `Coba lagi dalam ${Math.ceil(seconds)} detik.`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `Coba lagi dalam ${minutes} menit.`;
  return `Coba lagi dalam ${Math.ceil(minutes / 60)} jam.`;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  form?: FormData;
  headers?: Record<string, string>;
  retryOn401?: boolean;
}

let refreshing: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) return false;
      const payload = (await response.json()) as Envelope<AuthResponse>;
      if (!payload.data?.access_token) return false;
      session.setAccessToken(payload.data.access_token);
      if (payload.data.user) session.updateUser(payload.data.user);
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal, form, headers = {}, retryOn401 = true } = options;
  const token = session.get()?.accessToken;
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    signal,
    credentials: 'include',
    headers: {
      ...(form ? {} : body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });

  if (response.status === 401 && retryOn401 && (await refreshSession())) {
    return request<T>(path, { ...options, retryOn401: false });
  }

  if (response.status === 204) return undefined as T;

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : undefined;

  if (!response.ok) {
    const error = (payload as { error?: { code: string; message: string; details?: { field: string; message: string }[] }; request_id?: string })?.error;
    const retryAfter = Number(response.headers.get('retry-after'));
    throw new ApiError(
      response.status,
      error?.code ?? `HTTP_${response.status}`,
      error?.message ?? 'Terjadi kesalahan. Coba lagi.',
      error?.details,
      (payload as { request_id?: string })?.request_id,
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
    );
  }

  return payload as T;
}

interface LoginRequestShape {
  email: string;
  password: string;
}

export const api = {
  async register(input: { email: string; password: string; name: string; phone?: string }) {
    return request<Envelope<{ id: string; email: string; name: string; status: string }>>('/auth/register', {
      method: 'POST',
      body: input,
    });
  },

  async verifyEmail(input: { email: string; code: string }) {
    return request<Envelope<AuthResponse>>('/auth/verify-email', { method: 'POST', body: input });
  },

  async resendVerification(input: { email: string }) {
    return request<Envelope<{ message: string }>>('/auth/resend-verification', { method: 'POST', body: input });
  },

  async login(input: LoginRequestShape) {
    return request<Envelope<AuthResponse>>('/auth/login', { method: 'POST', body: input });
  },

  async logout() {
    return request<Envelope<{ message: string }>>('/auth/logout', { method: 'POST', retryOn401: false });
  },

  async me() {
    return request<Envelope<User>>('/auth/me');
  },

  async trips(params: { q?: string; category?: string; destination?: string; limit?: number } = {}) {
    const search = new URLSearchParams();
    if (params.q) search.set('q', params.q);
    if (params.category && params.category !== 'ALL') search.set('category', params.category);
    if (params.destination) search.set('destination', params.destination);
    search.set('limit', String(params.limit ?? 20));
    return request<ListEnvelope<TripCard>>(`/trips?${search.toString()}`);
  },

  async trip(idOrSlug: string) {
    return request<Envelope<TripDetail>>(`/trips/${encodeURIComponent(idOrSlug)}`);
  },

  async categories() {
    return request<ListEnvelope<CategoryCount>>('/categories');
  },

  async destinations() {
    return request<ListEnvelope<DestinationCount>>('/destinations');
  },

  async lockReservation(input: LockRequest) {
    return request<Envelope<LockResponse>>('/reservations/lock', { method: 'POST', body: input });
  },

  async reservation(id: string) {
    return request<Envelope<Reservation>>(`/reservations/${id}`);
  },

  async cancelReservation(id: string) {
    return request<Envelope<Reservation>>(`/reservations/${id}/cancel`, { method: 'POST' });
  },

  async validatePromo(code: string, subtotalIdr: number) {
    return request<Envelope<PromoValidation>>('/promos/validate', {
      method: 'POST',
      body: { code, subtotal_idr: subtotalIdr },
    });
  },

  async createPayment(reservationId: string, method: PaymentMethod) {
    return request<Envelope<Payment>>(`/reservations/${reservationId}/payments`, {
      method: 'POST',
      body: { method },
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    });
  },

  async payment(id: string) {
    return request<Envelope<Payment>>(`/payments/${encodeURIComponent(id)}`);
  },

  async myTrips(tab: MyTripTab, page = 1) {
    const search = new URLSearchParams({ tab, page: String(page), limit: '20' });
    return request<ListEnvelope<MyTrip>>(`/mytrips?${search.toString()}`);
  },

  async myTrip(id: string) {
    return request<Envelope<MyTripDetail>>(`/mytrips/${encodeURIComponent(id)}`);
  },

  async cancelMyTrip(id: string) {
    return request<Envelope<MyTrip>>(`/mytrips/${encodeURIComponent(id)}/cancel`, { method: 'POST' });
  },

  async documents(reservationId: string) {
    return request<Envelope<Completeness>>(`/reservations/${reservationId}/documents/completeness`);
  },

  async deleteDocument(id: string) {
    return request<void>(`/documents/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
};

export interface UploadInput {
  reservationId: string;
  participantId: string;
  type: DocumentType;
  file: File;
  onProgress?: (percent: number) => void;
}

/** XHR, because fetch cannot report upload progress. */
export function uploadDocument(input: UploadInput): Promise<DocumentRecord> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', input.file);
    form.append('type', input.type);
    form.append('participant_id', input.participantId);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/documents`);
    xhr.withCredentials = true;
    const token = session.get()?.accessToken;
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) input.onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      const payload = safeJson(xhr.responseText);
      if (xhr.status >= 200 && xhr.status < 300) {
        input.onProgress?.(100);
        const record = (payload as Envelope<DocumentRecord> | undefined)?.data;
        if (record) resolve(record);
        else reject(new ApiError(xhr.status, 'EMPTY_RESPONSE', 'Dokumen tidak tersimpan.'));
        return;
      }
      const error = (payload as { error?: { code: string; message: string; details?: { field: string; message: string }[] }; request_id?: string })?.error;
      reject(
        new ApiError(
          xhr.status,
          error?.code ?? `HTTP_${xhr.status}`,
          error?.message ?? 'Unggah dokumen gagal.',
          error?.details,
          (payload as { request_id?: string })?.request_id,
        ),
      );
    };
    xhr.onerror = () => reject(new ApiError(0, 'NETWORK', 'Jaringan terputus saat mengunggah.'));
    xhr.ontimeout = () => reject(new ApiError(0, 'TIMEOUT', 'Unggah terlalu lama. Coba lagi.'));
    xhr.send(form);
  });
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export type { ParticipantInput };