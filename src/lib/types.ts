// Types transcribed from internal/api/openapi.json (hsi-go-api, 29 paths).
// Every field name below exists in the contract; nothing is invented.

export type Category = 'OPEN' | 'PRIVATE' | 'EDU';
export type Gender = 'MALE' | 'FEMALE';
export type ReservationStatus = 'PENDING_PAYMENT' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'COMPLETED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'VA_BCA' | 'VA_BSI' | 'VA_MANDIRI' | 'QRIS' | 'CARD';
export type MyTripTab = 'BELUM_BAYAR' | 'SIAP_BERANGKAT' | 'SELESAI' | 'RIWAYAT';
export type DocumentType = 'KTP' | 'BUKU_NIKAH' | 'KK' | 'PASSPORT' | 'OTHER';

export interface Meta {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

export interface AuthResponse {
  access_token: string;
  expires_in: number;
  user: User;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role?: string;
  email_verified_at?: string;
}

export interface TripCard {
  id: string;
  slug: string;
  title: string;
  category: string;
  departure_city: string;
  destination_city: string;
  duration_days: number;
  base_price_idr: number;
  currency: string;
  hero_image_url?: string;
  rating_avg?: number;
  rating_count?: number;
  next_departure?: string;
  seats_available?: number;
}

export interface Schedule {
  id: string;
  start_date: string;
  end_date: string;
  departure_point: string;
  price_idr: number;
  currency: string;
  seats_available: number;
  status: string;
}

export interface Itinerary {
  day_number: number;
  title: string;
  description: string;
}

export interface Facility {
  name: string;
  type?: string;
}

export interface HotelOption {
  id: string;
  name: string;
  address: string;
  facilities: string[];
  extra_cost_idr: number;
  currency: string;
}

export interface TripDetail extends TripCard {
  description: string;
  required_documents: string[];
  itineraries: Itinerary[];
  facilities: Facility[];
  hotel_options: HotelOption[];
  schedules: Schedule[];
}

export interface ParticipantInput {
  full_name: string;
  gender: Gender;
  phone: string;
  email: string;
}

export interface Participant extends ParticipantInput {
  id: string;
}

export interface LockRequest {
  schedule_id: string;
  participants: ParticipantInput[];
  hotel_id?: string;
  pickup_point: string;
  notes?: string;
  promo_code?: string;
}

export interface Reservation {
  id: string;
  code: string;
  status: ReservationStatus;
  trip_id: string;
  schedule_id: string;
  participants: Participant[];
  unit_price_idr: number;
  total_amount_idr: number;
  discount_idr: number;
  currency: string;
  pickup_point: string;
  notes?: string;
  hotel_id?: string;
  promo_code_id?: string;
  lock_expires_at?: string;
  payment_expires_at?: string;
  seats_remaining?: number;
}

export interface LockResponse {
  id: string;
  code: string;
  status: ReservationStatus;
  currency: string;
  lock_expires_at: string;
  total_amount_idr: number;
  discount_idr: number;
  seats_remaining: number;
}

export interface Payment {
  id: string;
  reservation_id: string;
  provider: string;
  method: PaymentMethod;
  status: PaymentStatus;
  currency: string;
  amount_idr: number;
  va_number?: string;
  qr_string?: string;
  expires_at?: string;
  paid_at?: string;
  created_at: string;
}

export interface PromoValidation {
  valid: boolean;
  code: string;
  discount_idr: number;
  final_total_idr: number;
}

export interface DocumentRecord {
  id: string;
  reservation_id: string;
  participant_id: string;
  type: DocumentType;
  size_bytes: number;
  status: string;
  created_at: string;
}

export interface CompletenessParticipant {
  participant_id: string;
  full_name: string;
  uploaded: string[];
  missing: string[];
}

export interface Completeness {
  reservation_id: string;
  required_documents: string[];
  complete: boolean;
  participants: CompletenessParticipant[];
}

export interface MyTrip {
  id: string;
  code: string;
  status: ReservationStatus;
  tab: MyTripTab;
  trip: {
    id: string;
    slug: string;
    title: string;
    category: string;
    departure_city: string;
    destination_city: string;
  };
  schedule: { id: string; start_date: string; end_date: string };
  participants_count: number;
  total_amount_idr: number;
  currency: string;
  payment?: Payment;
  join_wa_url?: string;
  timer?: { kind: 'LOCK' | 'PAYMENT'; expires_at: string; remaining_seconds: number };
  created_at: string;
}

export interface MyTripDetail extends MyTrip {
  participants: Participant[];
  documents: DocumentRecord[];
  discount_idr: number;
  pickup_point: string;
  notes?: string;
  lock_expires_at?: string;
  payment_expires_at?: string;
  paid_at?: string;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface DestinationCount {
  city: string;
  count: number;
}

export interface Envelope<T> {
  data: T;
}

export interface ListEnvelope<T> {
  data: T[];
  meta: Meta;
}