import { useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { usePayment, useReservation } from '@/queries';
import { formatDateTimeID, formatIDR } from '@/lib/format';
import { FlowScreen } from '@/components/AppShell';
import { Button, EmptyState, Skeleton } from '@/components/ui';
import { CheckIcon, InfoIcon, WhatsAppIcon } from '@/components/icons';

export function SuccessPage() {
  const { reservationId } = useParams({ from: '/success/$reservationId' });
  const { payment: paymentId } = useSearch({ from: '/success/$reservationId' }) as { payment?: string };
  const navigate = useNavigate();
  const reservation = useReservation(reservationId);
  const payment = usePayment(paymentId ?? '');

  if (reservation.isPending || (paymentId && payment.isPending)) {
    return (
      <FlowScreen title="Konfirmasi">
        <div className="space-y-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-44" />
        </div>
      </FlowScreen>
    );
  }

  if (!reservation.data) {
    return (
      <FlowScreen title="Konfirmasi">
        <EmptyState title="Transaksi tidak ditemukan" description="Buka Tripku untuk melihat status terbaru." />
      </FlowScreen>
    );
  }

  const trip = reservation.data.data;
  const paid = payment.data?.data;

  return (
    <div className="shell px-5 py-8">
      <div className="flex flex-col items-center text-center">
        <span className="grid size-16 place-items-center rounded-full bg-mint text-brand">
          <CheckIcon className="size-8" />
        </span>
        <h1 className="mt-4 text-[22px] leading-snug font-extrabold">Alhamdulillah, Pembayaran Berhasil!</h1>
        <p className="mt-1 max-w-[32ch] text-[12px] leading-relaxed text-muted">
          Kursi kamu sudah aman. Detail perjalanan bisa dilihat di Tripku.
        </p>
      </div>

      <section className="card mt-6 divide-y divide-line-soft">
        <Row label="No Transaksi" value={trip.code} mono />
        <Row
          label="No Virtual Account"
          value={paid?.va_number?.replace(/(\d{4})(?=\d)/g, '$1 ') ?? '-'}
          mono
        />
        <Row label="Jumlah Pembayaran" value={formatIDR(paid?.amount_idr ?? trip.total_amount_idr)} />
        <Row label="Waktu" value={formatDateTimeID(paid?.paid_at ?? new Date().toISOString())} />
        <Row label="Peserta" value={`${trip.participants.length} orang`} />
      </section>

      <section className="mt-4 rounded-2xl bg-mint/50 p-4">
        <p className="flex items-center gap-2 text-[12px] font-bold text-brand-dark">
          <InfoIcon className="size-4" /> Informasi Penting!
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-brand-dark/90">
          Grup WhatsApp perjalanan dibuka di halaman Tripku setelah pembayaran terverifikasi. Gabung supaya informasi jemput
          dan itinerary tidak terlewat.
        </p>
      </section>

      <div className="mt-6 space-y-2">
        <Button full size="lg" onClick={() => void navigate({ to: '/mytrips', search: { tab: 'SIAP_BERANGKAT' } })}>
          Menuju Halaman Tripku
        </Button>
        <Button full size="lg" variant="outline" onClick={() => void navigate({ to: '/home' })}>
          Kembali ke Beranda
        </Button>
        {paid?.status === 'PAID' ? (
          <p className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-muted">
            <WhatsAppIcon className="size-4 text-brand-dark" /> Tombol grup WA ada di kartu trip kamu.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <span className="text-[11px] text-muted">{label}</span>
      <span className={`text-[12px] font-bold ${mono ? 'tabular-nums' : ''}`}>{value}</span>
    </div>
  );
}