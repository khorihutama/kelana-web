import { useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useCompleteness, useDeleteDocument, useLockReservation, useTrip, useValidatePromo, useReservation } from '@/queries';
import { ApiError, uploadDocument } from '@/lib/api';
import { formatDateRange, formatIDR } from '@/lib/format';
import { participantSchema, flattenIssues, type ParticipantForm } from '@/lib/validation';
import { FlowScreen } from '@/components/AppShell';
import { Badge, Button, Divider, EmptyState, Skeleton } from '@/components/ui';
import { Modal, useToast } from '@/components/overlay';
import { RadioCard, SelectField, Stepper, TextAreaField, TextField, UploadItem } from '@/components/form';
import { TimerChip } from '@/components/Timer';
import { ClockIcon, InfoIcon, MapPinIcon, UploadIcon, UsersIcon } from '@/components/icons';
import type { DocumentType } from '@/lib/types';

interface Draft {
  key: string;
  full_name: string;
  gender: 'MALE' | 'FEMALE' | '';
  phone: string;
  email: string;
}

interface UploadState {
  progress: number;
  fileName: string;
  sizeBytes: number;
  error?: string;
  documentId?: string;
}

const emptyDraft = (): Draft => ({
  key: crypto.randomUUID(),
  full_name: '',
  gender: '',
  phone: '+62',
  email: '',
});

export function BookingPage() {
  const { slug } = useParams({ from: '/booking/$slug' });
  const { schedule: scheduleId } = useSearch({ from: '/booking/$slug' }) as { schedule?: string };
  const navigate = useNavigate();
  const toast = useToast();
  const trip = useTrip(slug);
  const lock = useLockReservation();
  const promo = useValidatePromo();

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<ParticipantForm>({ full_name: '', gender: 'MALE', phone: '+62', email: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [hotelId, setHotelId] = useState<string>('');
  const [pickup, setPickup] = useState('');
  const [pickupError, setPickupError] = useState('');
  const [notes, setNotes] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoChecked, setPromoChecked] = useState(false);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [uploads, setUploads] = useState<Record<string, UploadState>>({});
  const [expired, setExpired] = useState(false);

  const reservation = useReservation(reservationId ?? '');
  const completeness = useCompleteness(reservationId ?? '');
  const removeDocument = useDeleteDocument(reservationId ?? '');

  const data = trip.data?.data;
  const schedule = data?.schedules.find((item) => item.id === scheduleId) ?? data?.schedules[0];
  const hotels = data?.hotel_options ?? [];
  const hotel = hotels.find((option) => option.id === hotelId) ?? (hotels.length === 1 ? hotels[0] : undefined);

  const unitPrice = reservation.data?.data.unit_price_idr ?? schedule?.price_idr ?? 0;
  const participantCount = reservation.data?.data.participants.length ?? drafts.length;
  const hotelExtra = hotel?.extra_cost_idr ?? 0;
  const subtotal = unitPrice * participantCount + hotelExtra;
  const total = reservation.data?.data.total_amount_idr ?? subtotal - discount;

  const locks = useMemo(() => {
    const map = new Map<string, UploadState>();
    for (const [key, value] of Object.entries(uploads)) map.set(key, value);
    return map;
  }, [uploads]);

  if (trip.isPending) {
    return (
      <FlowScreen title="Reservasi">
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-40" />
          <Skeleton className="h-32" />
        </div>
      </FlowScreen>
    );
  }

  if (!data || !schedule) {
    return (
      <FlowScreen title="Reservasi">
        <EmptyState title="Jadwal tidak tersedia" description="Kembali ke detail trip dan pilih jadwal lain." />
      </FlowScreen>
    );
  }

  function openParticipant(index: number) {
    const draft = drafts[index] ?? emptyDraft();
    setForm({
      full_name: draft.full_name,
      gender: draft.gender === 'FEMALE' ? 'FEMALE' : 'MALE',
      phone: draft.phone,
      email: draft.email,
    });
    setFormErrors({});
    setEditing(index);
  }

  function saveParticipant() {
    const parsed = participantSchema.safeParse(form);
    if (!parsed.success) {
      setFormErrors(flattenIssues(parsed.error));
      return;
    }
    if (editing === null) return;
    setDrafts((current) =>
      current.map((draft, index) =>
        index === editing
          ? {
              ...draft,
              full_name: parsed.data.full_name,
              gender: parsed.data.gender,
              phone: parsed.data.phone,
              email: parsed.data.email,
            }
          : draft,
      ),
    );
    setEditing(null);
  }

  function changeCount(next: number) {
    if (next === drafts.length) return;
    if (next < drafts.length) {
      setDrafts(drafts.slice(0, next));
      return;
    }
    const firstNew = drafts.length;
    const added = Array.from({ length: next - drafts.length }, emptyDraft);
    setDrafts([...drafts, ...added]);
    setForm({ full_name: '', gender: 'MALE', phone: '+62', email: '' });
    setFormErrors({});
    setEditing(firstNew);
  }

  async function checkPromo() {
    if (!promoCode.trim()) return;
    try {
      const result = await promo.mutateAsync({ code: promoCode, subtotal: unitPrice * drafts.length + hotelExtra });
      setPromoChecked(true);
      if (result.data.valid) {
        setDiscount(result.data.discount_idr);
        toast.push(`Promo ${result.data.code} dipakai: hemat ${formatIDR(result.data.discount_idr)}`);
      } else {
        setDiscount(0);
        toast.push('Kode promo tidak berlaku.', 'error');
      }
    } catch {
      toast.push('Gagal memeriksa kode promo.', 'error');
    }
  }

  async function lockSeats() {
    if (drafts.length === 0) {
      toast.push('Tambahkan minimal satu peserta.', 'error');
      return;
    }
    const incomplete = drafts.find((draft) => !draft.full_name || !draft.gender || !draft.phone || !draft.email);
    if (incomplete) {
      toast.push('Lengkapi data semua peserta dulu.', 'error');
      openParticipant(drafts.indexOf(incomplete));
      return;
    }
    if (pickup.trim().length < 3) {
      setPickupError('Anda belum mengisi Titik Penjemputan');
      return;
    }
    setPickupError('');
    try {
      const result = await lock.mutateAsync({
        schedule_id: schedule!.id,
        participants: drafts.map((draft) => ({
          full_name: draft.full_name,
          gender: draft.gender === 'FEMALE' ? 'FEMALE' : 'MALE',
          phone: draft.phone,
          email: draft.email,
        })),
        hotel_id: hotel?.id,
        pickup_point: pickup.trim(),
        notes: notes.trim() || undefined,
        promo_code: promoChecked && discount > 0 ? promoCode.trim().toUpperCase() : undefined,
      });
      setReservationId(result.data.id);
      toast.push('Kursi dikunci 15 menit. Unggah dokumen lalu lanjut bayar.');
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 409) {
        toast.push('Kuota habis untuk jadwal ini. Pilih jadwal lain.', 'error');
        void navigate({ to: '/trips/$slug', params: { slug: data!.slug } });
        return;
      }
      toast.push(caught instanceof ApiError ? caught.message : 'Gagal mengunci kursi.', 'error');
    }
  }

  async function startUpload(participantId: string, type: DocumentType, file: File) {
    const key = `${participantId}:${type}`;
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      setUploads((current) => ({
        ...current,
        [key]: { progress: 0, fileName: file.name, sizeBytes: file.size, error: 'Hanya JPEG, PNG, atau PDF.' },
      }));
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setUploads((current) => ({
        ...current,
        [key]: { progress: 0, fileName: file.name, sizeBytes: file.size, error: 'Ukuran melebihi 3 MB.' },
      }));
      return;
    }
    setUploads((current) => ({ ...current, [key]: { progress: 0, fileName: file.name, sizeBytes: file.size } }));
    try {
      const record = await uploadDocument({
        reservationId: reservationId ?? '',
        participantId,
        type,
        file,
        onProgress: (progress) => {
          setUploads((current) => ({ ...current, [key]: { ...current[key]!, progress } }));
        },
      });
      setUploads((current) => ({
        ...current,
        [key]: { ...current[key]!, progress: 100, documentId: record.id },
      }));
      await completeness.refetch();
    } catch (caught) {
      setUploads((current) => ({
        ...current,
        [key]: {
          ...current[key]!,
          error: caught instanceof ApiError ? caught.message : 'Unggah gagal.',
        },
      }));
    }
  }

  async function removeUpload(key: string) {
    const item = uploads[key];
    if (item?.documentId) {
      try {
        await removeDocument.mutateAsync(item.documentId);
        await completeness.refetch();
      } catch {
        toast.push('Gagal menghapus dokumen.', 'error');
        return;
      }
    }
    setUploads((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  const locked = Boolean(reservationId) && Boolean(reservation.data);
  const isComplete = completeness.data?.data.complete ?? false;
  const paid = reservation.data?.data.status === 'PAID';

  return (
    <FlowScreen
      title="Reservasi"
      subtitle={data.title}
      footer={
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-muted">Total</span>
            <span className="text-[16px] font-extrabold text-brand-dark">{formatIDR(total)}</span>
          </div>
          {locked ? (
            <Button
              full
              size="lg"
              disabled={!isComplete || paid}
              onClick={() => void navigate({ to: '/checkout/$reservationId', params: { reservationId: reservationId! } })}
            >
              {paid ? 'Sudah dibayar' : isComplete ? 'Pilih Pembayaran' : 'Lengkapi dokumen dulu'}
            </Button>
          ) : (
            <Button full size="lg" loading={lock.isPending} onClick={() => void lockSeats()}>
              Kunci Kursi &amp; Lanjutkan
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        <section className="card p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] text-muted">{data.category} · {data.duration_days} hari</p>
              <p className="text-[13px] font-bold">{formatDateRange(schedule.start_date, schedule.end_date)}</p>
              <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted">
                <MapPinIcon className="size-3.5" /> {schedule.departure_point}
              </p>
            </div>
            {locked && reservation.data ? (
              <TimerChip
                expiresAt={reservation.data.data.lock_expires_at}
                kind="LOCK"
                onExpire={() => setExpired(true)}
              />
            ) : (
              <Badge tone="warning">
                <ClockIcon className="size-3" /> 15 menit
              </Badge>
            )}
          </div>
        </section>

        <section className="card p-3.5">
          <Stepper
            label="Jumlah Peserta"
            value={locked ? participantCount : drafts.length}
            min={0}
            max={10}
            onChange={(next) => (locked ? undefined : changeCount(next))}
          />
          <Divider className="my-3" />
          {drafts.length === 0 ? (
            <EmptyState
              icon={<UsersIcon />}
              title="Peserta Trip Belum Ditambahkan"
              description="Tambahkan jumlah peserta agar bisa mengisi informasi identitas peserta."
            />
          ) : (
            <ul className="space-y-2">
              {drafts.map((draft, index) => {
                const gender = draft.gender === 'FEMALE' ? 'Wanita' : draft.gender === 'MALE' ? 'Pria' : 'Belum diisi';
                return (
                  <li key={draft.key} className="rounded-xl border border-line px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold">
                          Peserta {index + 1} <span className="font-normal text-muted">· {gender}</span>
                        </p>
                        <p className="truncate text-[11px] text-muted">
                          {draft.full_name || 'Nama belum diisi'} · {draft.phone}
                        </p>
                      </div>
                      {!locked ? (
                        <button
                          type="button"
                          onClick={() => openParticipant(index)}
                          className="text-[11px] font-bold text-brand-dark"
                        >
                          {draft.full_name ? 'Edit' : 'Isi'}
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card p-3.5">
          <h2 className="mb-2 text-[13px] font-bold">Pilihan Hotel</h2>
          <div className="space-y-2">
            {hotels.map((option) => (
              <RadioCard
                key={option.id}
                name="hotel"
                checked={(hotel?.id ?? hotels[0]?.id) === option.id}
                onChange={() => !locked && setHotelId(option.id)}
                title={option.name}
                subtitle={option.address}
                meta={option.extra_cost_idr > 0 ? `+${formatIDR(option.extra_cost_idr)}` : 'termasuk'}
              >
                <ul className="mt-1.5 flex flex-wrap gap-1">
                  {option.facilities.map((facility) => (
                    <li key={facility} className="rounded-full bg-canvas px-2 py-0.5 text-[10px] text-muted">
                      {facility}
                    </li>
                  ))}
                </ul>
              </RadioCard>
            ))}
          </div>
          {hotels.length === 1 ? (
            <p className="hint">Trip ini hanya punya satu pilihan hotel, otomatis dipilih.</p>
          ) : null}
        </section>

        <section className="card space-y-3 p-3.5">
          <TextField
            label="Titik Penjemputan"
            name="pickup"
            placeholder="misal: stasiun, terminal bus atau bandara"
            value={pickup}
            disabled={locked}
            error={pickupError}
            hint="Wajib diisi supaya tim bisa menjemput di titik yang benar."
            onChange={(event) => {
              setPickup(event.target.value);
              if (event.target.value.trim().length >= 3) setPickupError('');
            }}
          />
          <TextAreaField
            label="Catatan Khusus"
            name="notes"
            optional
            placeholder="Alergi makanan, kondisi kesehatan, atau permintaan lain"
            value={notes}
            disabled={locked}
            maxLength={500}
            onChange={(event) => setNotes(event.target.value)}
          />
        </section>

        <section className="card p-3.5">
          <h2 className="mb-1 text-[13px] font-bold">Kode Promo</h2>
          <div className="flex gap-2">
            <input
              value={promoCode}
              disabled={locked}
              onChange={(event) => setPromoCode(event.target.value.toUpperCase())}
              placeholder="HSIGO2025"
              aria-label="Kode promo"
              className="field"
            />
            <Button variant="outline" onClick={() => void checkPromo()} loading={promo.isPending} disabled={locked}>
              Cek
            </Button>
          </div>
          {promoChecked ? (
            <p className={`mt-1.5 text-[11px] font-semibold ${discount > 0 ? 'text-brand-dark' : 'text-danger'}`}>
              {discount > 0 ? `Promo aktif, hemat ${formatIDR(discount)}.` : 'Kode promo tidak berlaku.'}
            </p>
          ) : null}
        </section>

        {locked ? (
          <section className="card p-3.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-[13px] font-bold">Dokumen Pendukung</h2>
              <Badge tone={isComplete ? 'brand' : 'warning'}>{isComplete ? 'Lengkap' : 'Belum lengkap'}</Badge>
            </div>
            <p className="mb-3 text-[11px] leading-relaxed text-muted">
              {data.required_documents.join(', ')} · JPEG/PNG/PDF maks 3 MB. Semua peserta wajib melengkapi.
            </p>
            <div className="space-y-3">
              {(reservation.data?.data.participants ?? []).map((participant, index) => (
                <div key={participant.id} className="space-y-2">
                  <p className="text-[12px] font-bold">
                    Peserta {index + 1} · {participant.full_name}
                  </p>
                  {data.required_documents.map((type) => {
                    const key = `${participant.id}:${type}`;
                    const state = locks.get(key);
                    return (
                      <div key={key}>
                        {state ? (
                          <UploadItem
                            fileName={state.fileName}
                            sizeBytes={state.sizeBytes}
                            progress={state.progress}
                            error={state.error}
                            onRemove={() => void removeUpload(key)}
                          />
                        ) : (
                          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-line px-3 py-2.5">
                            <span className="flex items-center gap-2 text-[11px] font-semibold text-body">
                              <UploadIcon className="size-4 text-brand-dark" />
                              {type} — unggah dokumen
                            </span>
                            <span className="text-[10px] text-muted">maks 3 MB</span>
                            <input
                              type="file"
                              className="sr-only"
                              accept="image/jpeg,image/png,application/pdf"
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file) void startUpload(participant.id, type as DocumentType, file);
                                event.target.value = '';
                              }}
                            />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            {completeness.data ? (
              <p className={`mt-3 text-[11px] font-semibold ${isComplete ? 'text-brand-dark' : 'text-[#92400e]'}`}>
                {isComplete
                  ? 'Semua dokumen lengkap. Lanjutkan ke pembayaran.'
                  : 'Lengkapi dokumen di atas untuk membuka pembayaran.'}
              </p>
            ) : null}
          </section>
        ) : null}

        <section className="card p-3.5">
          <h2 className="mb-2 text-[13px] font-bold">Ringkasan Biaya</h2>
          <dl className="space-y-1.5 text-[12px]">
            <div className="flex justify-between">
              <dt className="text-muted">
                Biaya trip · {participantCount} peserta
              </dt>
              <dd className="font-semibold">{formatIDR(unitPrice * participantCount)}</dd>
            </div>
            {hotel ? (
              <div className="flex justify-between">
                <dt className="text-muted">{hotel.name}</dt>
                <dd className="font-semibold">{hotel.extra_cost_idr > 0 ? formatIDR(hotel.extra_cost_idr) : 'Termasuk'}</dd>
              </div>
            ) : null}
            {discount > 0 ? (
              <div className="flex justify-between text-brand-dark">
                <dt>Diskon promo</dt>
                <dd className="font-semibold">-{formatIDR(discount)}</dd>
              </div>
            ) : null}
            <Divider className="my-1.5" />
            <div className="flex items-baseline justify-between">
              <dt className="text-[13px] font-bold">Total (setelah pajak)</dt>
              <dd className="text-[16px] font-extrabold text-brand-dark">{formatIDR(total)}</dd>
            </div>
          </dl>
          <p className="mt-2 inline-flex items-start gap-1 text-[10px] leading-relaxed text-muted">
            <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
            Harga dalam rupiah bulat, tanpa biaya tersembunyi.
          </p>
        </section>
      </div>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={`Tambahkan Data Peserta ${(editing ?? 0) + 1}`}
        footer={
          <Button full size="lg" onClick={saveParticipant}>
            Simpan Data
          </Button>
        }
      >
        <div className="space-y-3">
          <TextField
            label="Nama Lengkap"
            name="full_name"
            value={form.full_name}
            error={formErrors.full_name}
            placeholder="Nama sesuai KTP"
            onChange={(event) => setForm({ ...form, full_name: event.target.value })}
          />
          <SelectField
            label="Gender"
            name="gender"
            value={form.gender}
            error={formErrors.gender}
            onChange={(event) => setForm({ ...form, gender: event.target.value as 'MALE' | 'FEMALE' })}
          >
            <option value="MALE">Pria</option>
            <option value="FEMALE">Wanita</option>
          </SelectField>
          <TextField
            label="Nomor Telepon"
            name="phone"
            inputMode="tel"
            value={form.phone}
            error={formErrors.phone}
            placeholder="+62"
            hint="Diawali dengan +62."
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            error={formErrors.email}
            placeholder="nama@email.com"
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
        </div>
      </Modal>

      <Modal
        open={expired}
        onClose={() => setExpired(false)}
        title="Waktu pengisian habis"
        dismissible={false}
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="lg" onClick={() => setExpired(false)}>
              Tetap di sini
            </Button>
            <Button size="lg" onClick={() => void navigate({ to: '/trips/$slug', params: { slug: data.slug } })}>
              Pilih Tanggal Lain
            </Button>
          </div>
        }
      >
        <p className="text-[13px] leading-relaxed text-body">
          Kursi yang kamu kunci sudah dilepas. Silakan pilih ulang jadwal untuk mendapatkan kursi baru.
        </p>
      </Modal>
    </FlowScreen>
  );
}