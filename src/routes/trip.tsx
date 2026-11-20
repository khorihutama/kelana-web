import { useNavigate, useParams } from '@tanstack/react-router';
import { useState } from 'react';
import { useTrip } from '@/queries';
import { formatDateRange, formatIDR } from '@/lib/format';
import { FlowScreen } from '@/components/AppShell';
import { Badge, Button, EmptyState, Skeleton } from '@/components/ui';
import { Modal } from '@/components/overlay';
import { RadioCard } from '@/components/form';
import { TripImage } from '@/components/TripCard';
import { CalendarIcon, CheckIcon, MapPinIcon, StarIcon, UsersIcon } from '@/components/icons';

export function TripDetailPage() {
  const { slug } = useParams({ from: '/trips/$slug' });
  const navigate = useNavigate();
  const trip = useTrip(slug);
  const [scheduleId, setScheduleId] = useState<string>('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showAllItinerary, setShowAllItinerary] = useState(false);

  if (trip.isPending) {
    return (
      <FlowScreen>
        <Skeleton className="h-[180px] w-full" />
        <div className="mt-4 space-y-3">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
      </FlowScreen>
    );
  }

  if (trip.isError || !trip.data) {
    return (
      <FlowScreen>
        <EmptyState title="Trip tidak ditemukan" description="Paket ini mungkin sudah tidak tersedia." />
      </FlowScreen>
    );
  }

  const data = trip.data.data;
  const openSchedules = data.schedules.filter((schedule) => schedule.seats_available > 0);
  const selected = data.schedules.find((schedule) => schedule.id === scheduleId) ?? openSchedules[0];
  const itineraries = showAllItinerary ? data.itineraries : data.itineraries.slice(0, 2);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col pb-24">
      <div className="relative">
        <TripImage slug={data.slug} city={data.destination_city} className="h-[220px] w-full" label={false} />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
          <button
            type="button"
            aria-label="Kembali"
            onClick={() => history.back()}
            className="grid size-9 place-items-center rounded-full bg-white/90 text-ink"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="m14 5-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <Badge tone="neutral">{data.category}</Badge>
        </div>
        <span className="absolute bottom-3 left-4 text-[11px] font-bold tracking-wide text-white/90 uppercase">
          {data.departure_city} → {data.destination_city}
        </span>
      </div>

      <div className="-mt-4 flex-1 rounded-t-3xl bg-canvas px-4 pt-5">
        <h1 className="text-[21px] leading-snug font-extrabold">{data.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1">
            <CalendarIcon className="size-3.5" /> {data.duration_days} hari
          </span>
          <span className="inline-flex items-center gap-1">
            <UsersIcon className="size-3.5" /> {openSchedules.reduce((total, item) => total + item.seats_available, 0)} kursi tersedia
          </span>
          {data.rating_avg ? (
            <span className="inline-flex items-center gap-1 text-[#b45309]">
              <StarIcon className="size-3" /> {data.rating_avg.toFixed(1)} ({data.rating_count})
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex items-baseline justify-between rounded-2xl border border-line bg-surface px-4 py-3">
          <div>
            <p className="text-[11px] text-muted">Mulai dari</p>
            <p className="text-[19px] font-extrabold text-brand-dark">{formatIDR(data.base_price_idr)}</p>
          </div>
          <p className="text-[11px] text-muted">per orang</p>
        </div>

        <section className="mt-5">
          <h2 className="section-title mb-2">Tentang Destinasi</h2>
          <p className="text-[13px] leading-relaxed text-body">{data.description}</p>
        </section>

        <section className="mt-5">
          <h2 className="section-title mb-2">Itinerary</h2>
          <ol className="space-y-2.5">
            {itineraries.map((item) => (
              <li key={item.day_number} className="flex gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-mint text-[11px] font-extrabold text-brand-dark">
                  D{item.day_number}
                </span>
                <div>
                  <p className="text-[13px] font-bold">{item.title}</p>
                  <p className="text-[12px] leading-relaxed text-muted">{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
          {data.itineraries.length > 2 ? (
            <button
              type="button"
              onClick={() => setShowAllItinerary((value) => !value)}
              className="mt-2 text-xs font-bold text-brand-dark"
            >
              {showAllItinerary ? 'Sembunyikan' : 'Lihat Semua'}
            </button>
          ) : null}
        </section>

        <section className="mt-5">
          <h2 className="section-title mb-2">Fasilitas</h2>
          <ul className="grid grid-cols-2 gap-2">
            {data.facilities.map((facility) => (
              <li
                key={facility.name}
                className={`flex items-start gap-1.5 rounded-xl border px-2.5 py-2 text-[11px] ${
                  facility.type === 'exclude' ? 'border-dashed border-line text-muted' : 'border-line bg-surface'
                }`}
              >
                <CheckIcon className={`mt-0.5 size-3.5 shrink-0 ${facility.type === 'exclude' ? 'text-muted' : 'text-brand'}`} />
                {facility.name}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-5">
          <h2 className="section-title mb-2">Jadwal Keberangkatan</h2>
          <div className="space-y-2">
            {data.schedules.map((schedule) => {
              const full = schedule.seats_available === 0;
              return (
                <div
                  key={schedule.id}
                  className={`flex items-center justify-between rounded-xl border px-3.5 py-3 ${
                    full ? 'border-dashed border-line bg-canvas' : 'border-line bg-surface'
                  }`}
                >
                  <div>
                    <p className="text-[13px] font-bold">{formatDateRange(schedule.start_date, schedule.end_date)}</p>
                    <p className="text-[11px] text-muted">Jemput: {schedule.departure_point}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] font-bold">{formatIDR(schedule.price_idr)}</p>
                    <p className={`text-[10px] font-semibold ${full ? 'text-danger' : 'text-brand-dark'}`}>
                      {full ? 'Kuota habis' : `${schedule.seats_available} kursi`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-5">
          <div className="rounded-xl bg-mint/50 px-3.5 py-3 text-[11px] leading-relaxed text-brand-dark">
            <p className="font-bold">Dokumen yang perlu disiapkan</p>
            <p className="mt-0.5">{data.required_documents.join(', ')} — diunggah setelah kursi dikunci, maksimal 3 MB per file.</p>
          </div>
        </section>
      </div>

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[480px] border-t border-line bg-surface/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-muted">Harga mulai</p>
            <p data-testid="trip-price" className="text-[14px] font-extrabold whitespace-nowrap text-brand-dark">
              {formatIDR(data.base_price_idr)}
            </p>
          </div>
          <Button
            className="shrink-0"
            size="lg"
            disabled={openSchedules.length === 0}
            onClick={() => {
              setScheduleId(openSchedules[0]?.id ?? '');
              setPickerOpen(true);
            }}
          >
            {openSchedules.length === 0 ? 'Kuota Habis' : 'Pesan Sekarang'}
          </Button>
        </div>
      </div>

      <Modal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Pilih jadwal"
        footer={
          <Button
            full
            size="lg"
            disabled={!selected}
            onClick={() => {
              setPickerOpen(false);
              setConfirmOpen(true);
            }}
          >
            Lanjutkan
          </Button>
        }
      >
        <div className="space-y-2">
          {openSchedules.length === 0 ? (
            <EmptyState title="Semua jadwal penuh" description="Coba lagi nanti atau pilih trip lain." />
          ) : (
            openSchedules.map((schedule) => (
              <RadioCard
                key={schedule.id}
                name="schedule"
                checked={selected?.id === schedule.id}
                onChange={() => setScheduleId(schedule.id)}
                title={formatDateRange(schedule.start_date, schedule.end_date)}
                subtitle={`Jemput: ${schedule.departure_point}`}
                meta={`${formatIDR(schedule.price_idr)}/orang`}
              >
                <p className="mt-1 text-[11px] text-brand-dark">{schedule.seats_available} kursi tersisa</p>
              </RadioCard>
            ))
          )}
        </div>
      </Modal>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Selesaikan Reservasi dalam waktu 15 Menit"
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="lg" onClick={() => setConfirmOpen(false)}>
              Pilih Tanggal Lain
            </Button>
            <Button
              size="lg"
              onClick={() => {
                if (!selected) return;
                void navigate({
                  to: '/booking/$slug',
                  params: { slug: data.slug },
                  search: { schedule: selected.id },
                });
              }}
            >
              Lanjutkan
            </Button>
          </div>
        }
      >
        <p className="text-[13px] leading-relaxed text-body">
          Anda diberi waktu maksimal 15 menit untuk melengkapi data reservasi. Jika waktu habis, silakan kembali memilih ulang
          jadwal trip.
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-mint/50 px-3 py-2.5 text-[11px] text-brand-dark">
          <MapPinIcon className="size-4 shrink-0" />
          Kursi baru benar-benar dikunci saat kamu menekan “Kunci Kursi” di halaman reservasi.
        </div>
      </Modal>
    </div>
  );
}