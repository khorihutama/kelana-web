import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useState } from 'react';
import { useCancelMyTrip, useMyTrips } from '@/queries';
import { formatDateRange, formatIDR } from '@/lib/format';
import { TabBar, TabScreen } from '@/components/AppShell';
import { Badge, Button, EmptyState, Skeleton } from '@/components/ui';
import { Modal, useToast } from '@/components/overlay';
import { TimerChip } from '@/components/Timer';
import { CalendarIcon, TicketIcon, UsersIcon, WhatsAppIcon } from '@/components/icons';
import type { MyTrip, MyTripTab } from '@/lib/types';

const tabs: { value: MyTripTab; label: string }[] = [
  { value: 'BELUM_BAYAR', label: 'Belum Bayar' },
  { value: 'SIAP_BERANGKAT', label: 'Siap Berangkat' },
  { value: 'SELESAI', label: 'Selesai' },
  { value: 'RIWAYAT', label: 'Riwayat' },
];

const statusBadge = (status: MyTrip['status']) => {
  if (status === 'PAID') return <Badge tone="brand">Siap Berangkat</Badge>;
  if (status === 'PENDING_PAYMENT') return <Badge tone="warning">Menunggu Pembayaran</Badge>;
  if (status === 'CANCELLED') return <Badge tone="danger">Dibatalkan</Badge>;
  if (status === 'COMPLETED') return <Badge tone="muted">Selesai</Badge>;
  if (status === 'EXPIRED') return <Badge tone="muted">Kedaluwarsa</Badge>;
  return <Badge tone="muted">{status}</Badge>;
};

export function MyTripsPage() {
  const { tab } = useSearch({ from: '/mytrips' }) as { tab?: MyTripTab };
  const active = tab ?? 'BELUM_BAYAR';
  const trips = useMyTrips(active);
  const cancel = useCancelMyTrip();
  const toast = useToast();
  const navigate = useNavigate();
  const [target, setTarget] = useState<MyTrip | null>(null);

  const list = trips.data?.data ?? [];

  return (
    <TabScreen>
      <header className="px-4 pt-5 pb-3">
        <h1 className="text-[19px] font-extrabold">Tripku</h1>
        <p className="text-[12px] text-muted">Semua perjalanan dan status pembayarannya.</p>
      </header>

      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1" role="tablist">
        {tabs.map((item) => {
          const selected = active === item.value;
          return (
            <Link
              key={item.value}
              to="/mytrips"
              search={{ tab: item.value }}
              role="tab"
              aria-selected={selected}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[11px] font-bold ${
                selected ? 'border-brand bg-brand text-white' : 'border-line bg-surface text-body'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <section className="mt-4 space-y-3 px-4">
        {trips.isPending ? (
          Array.from({ length: 2 }).map((_, index) => <Skeleton key={index} className="h-[168px]" />)
        ) : list.length === 0 ? (
          <EmptyState
            icon={<TicketIcon />}
            title="Belum ada Trip Aktif Saat Ini"
            description="Pilih destinasi favoritmu dan kunci kursinya sebelum penuh."
            action={
              <Link to="/destinations" className="text-xs font-bold text-brand-dark">
                Cari Trip Sekarang
              </Link>
            }
          />
        ) : (
          list.map((trip) => (
            <article key={trip.id} className="card overflow-hidden" data-testid="mytrip-card">
              <div className="flex items-start justify-between gap-2 px-3.5 pt-3.5">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-muted">{trip.code}</p>
                  <h2 className="line-clamp-2 text-[14px] leading-snug font-bold">{trip.trip.title}</h2>
                </div>
                {statusBadge(trip.status)}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 px-3.5 text-[11px] text-muted">
                <span className="inline-flex items-center gap-1">
                  <CalendarIcon className="size-3.5" />
                  {formatDateRange(trip.schedule.start_date, trip.schedule.end_date)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <UsersIcon className="size-3.5" />
                  {trip.participants_count} peserta
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 px-3.5">
                <p className="text-[13px] font-extrabold text-brand-dark">{formatIDR(trip.total_amount_idr)}</p>
                {trip.timer?.expires_at && trip.status === 'PENDING_PAYMENT' ? (
                  <TimerChip expiresAt={trip.timer.expires_at} kind="PAYMENT" compact />
                ) : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-2 border-t border-line-soft px-3.5 py-3">
                {trip.status === 'PENDING_PAYMENT' && trip.payment ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() =>
                        void navigate({
                          to: '/pay/$paymentId',
                          params: { paymentId: trip.payment!.id },
                          search: { reservation: trip.id },
                        })
                      }
                    >
                      Bayar Sekarang
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setTarget(trip)}>
                      Batalkan Trip
                    </Button>
                  </>
                ) : null}
                {trip.join_wa_url && trip.status === 'PAID' ? (
                  <a href={trip.join_wa_url} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="secondary" icon={<WhatsAppIcon className="size-4" />}>
                      Gabung Grup WA
                    </Button>
                  </a>
                ) : null}
                {trip.status === 'COMPLETED' ? (
                  <p className="text-[11px] text-muted">Perjalanan selesai. Terima kasih sudah ikut.</p>
                ) : null}
                {trip.status === 'CANCELLED' || trip.status === 'EXPIRED' ? (
                  <p className="text-[11px] text-muted">Reservasi ini sudah ditutup.</p>
                ) : null}
              </div>
            </article>
          ))
        )}
      </section>

      <Modal
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        title="Yakin ingin Membatalkan Trip?"
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="lg" onClick={() => setTarget(null)}>
              Tidak, Batalkan
            </Button>
            <Button
              variant="danger"
              size="lg"
              loading={cancel.isPending}
              onClick={async () => {
                if (!target) return;
                try {
                  await cancel.mutateAsync(target.id);
                  toast.push('Trip dibatalkan. Kursi dikembalikan.');
                  setTarget(null);
                } catch {
                  toast.push('Gagal membatalkan trip.', 'error');
                }
              }}
            >
              Ya, Batalkan Trip
            </Button>
          </div>
        }
      >
        <p className="text-[13px] leading-relaxed text-body">
          Kursi yang sudah dikunci akan dilepas dan orang lain bisa memesannya. Tindakan ini tidak bisa dibatalkan.
        </p>
      </Modal>

      <TabBar />
    </TabScreen>
  );
}