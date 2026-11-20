import { useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { useState } from 'react';
import { usePayment } from '@/queries';
import { api } from '@/lib/api';
import { formatIDR } from '@/lib/format';
import { FlowScreen } from '@/components/AppShell';
import { Button, EmptyState, Skeleton } from '@/components/ui';
import { Accordion, useToast } from '@/components/overlay';
import { TimerChip } from '@/components/Timer';
import { CheckIcon, CopyIcon, InfoIcon, QrIcon, ShieldIcon } from '@/components/icons';

const VA_INSTRUCTIONS: Record<string, string[]> = {
  BCA: ['Buka aplikasi BCA Mobile dan pilih m-Transfer.', 'Pilih BCA Virtual Account.', 'Masukkan nomor VA di atas.', 'Periksa nominal, lalu konfirmasi dengan PIN.'],
  MANDIRI: ['Buka Livin’ by Mandiri.', 'Pilih Bayar, lalu Multipayment.', 'Cari Kelana dan masukkan nomor VA.', 'Konfirmasi nominal dan selesaikan.'],
  BSI: ['Buka BSI Mobile.', 'Pilih Transfer, lalu Virtual Account.', 'Masukkan nomor VA BSI di atas.', 'Periksa nominal, lalu masukkan PIN.'],
};

export function PayPage() {
  const { paymentId } = useParams({ from: '/pay/$paymentId' });
  const { reservation } = useSearch({ from: '/pay/$paymentId' }) as { reservation?: string };
  const navigate = useNavigate();
  const toast = useToast();
  const payment = usePayment(paymentId);
  const [checking, setChecking] = useState(false);
  const [expired, setExpired] = useState(false);

  if (payment.isPending) {
    return (
      <FlowScreen title="Detail Pembayaran">
        <div className="space-y-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-40" />
        </div>
      </FlowScreen>
    );
  }

  if (payment.isError || !payment.data) {
    return (
      <FlowScreen title="Detail Pembayaran">
        <EmptyState title="Pembayaran tidak ditemukan" description="Coba buka lagi dari halaman Tripku." />
      </FlowScreen>
    );
  }

  const data = payment.data.data;
  const methodLabel =
    data.method === 'VA_BCA' ? 'BCA' : data.method === 'VA_BSI' ? 'BSI' : data.method === 'VA_MANDIRI' ? 'Mandiri' : data.method;
  const isVa = data.method.startsWith('VA_');
  const va = data.va_number?.replace(/(\d{4})(?=\d)/g, '$1 ') ?? '-';

  async function checkStatus() {
    setChecking(true);
    try {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const latest = await api.payment(paymentId);
        if (latest.data.status === 'PAID') {
          toast.push('Pembayaran diterima.');
          void navigate({
            to: '/success/$reservationId',
            params: { reservationId: reservation ?? latest.data.reservation_id },
            search: { payment: paymentId },
          });
          return;
        }
        await new Promise((resolve) => window.setTimeout(resolve, 1200));
      }
      toast.push('Pembayaran belum terlihat. Coba lagi beberapa saat.', 'info');
    } finally {
      setChecking(false);
    }
  }

  return (
    <FlowScreen
      title="Detail Pembayaran"
      footer={
        <div className="space-y-2">
          <Button full size="lg" loading={checking} onClick={() => void checkStatus()}>
            Saya Sudah Bayar
          </Button>
          <Button full variant="ghost" size="md" onClick={() => void navigate({ to: '/mytrips', search: { tab: 'BELUM_BAYAR' } })}>
            Bayar Nanti
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {data.status === 'PAID' ? (
          <div className="card flex items-center gap-3 border-brand/30 bg-mint/40 p-4">
            <CheckIcon className="size-6 text-brand" />
            <div>
              <p className="text-[13px] font-bold">Pembayaran sudah diterima</p>
              <p className="text-[11px] text-muted">Lanjut ke halaman sukses untuk detail transaksi.</p>
            </div>
          </div>
        ) : (
          <section className="card p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted">Selesaikan Pembayaran dalam waktu</p>
              <TimerChip expiresAt={data.expires_at} kind="PAYMENT" onExpire={() => setExpired(true)} />
            </div>
            <div className="mt-3 flex items-baseline justify-between gap-2">
              <p className="text-[11px] text-muted">Total</p>
              <p className="text-[22px] font-extrabold text-brand-dark">{formatIDR(data.amount_idr)}</p>
            </div>
            <p className="mt-1 text-[11px] text-muted">
              {methodLabel} · {data.id.slice(0, 8).toUpperCase()}
            </p>
          </section>
        )}

        {isVa ? (
          <section className="card p-4">
            <p className="text-[11px] text-muted">Nomor Virtual Account</p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="text-[18px] font-extrabold tracking-[0.04em] tabular-nums">{va}</p>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard?.writeText(data.va_number ?? '');
                  toast.push('Nomor VA disalin.');
                }}
                className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[10px] font-bold"
              >
                <CopyIcon className="size-3.5" /> Salin
              </button>
            </div>
            <p className="mt-1 text-[11px] text-muted">a.n. Kelana</p>
          </section>
        ) : data.qr_string ? (
          <section className="card p-4 text-center">
            <div className="mx-auto grid size-40 place-items-center rounded-xl border border-line bg-white">
              <QrIcon className="size-16 text-ink" />
            </div>
            <p className="mt-2 text-[11px] text-muted">
              QR demo. Di mode nyata, QRIS dibuat penyedia pembayaran.
            </p>
          </section>
        ) : (
          <section className="card p-4">
            <p className="text-[13px] font-bold">Pembayaran kartu</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              Kartu diproses di halaman penyedia pembayaran. Jangan tutup aplikasi sampai selesai.
            </p>
          </section>
        )}

        <section className="space-y-2">
          <Accordion title="Cara Pembayaran" icon={<InfoIcon />} defaultOpen>
            <ol className="list-inside list-decimal space-y-1 text-[12px] leading-relaxed text-body">
              {(VA_INSTRUCTIONS[methodLabel] ?? ['Ikuti instruksi pada aplikasi pembayaranmu.']).map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </Accordion>
          <p className="mt-2 flex items-start gap-2 px-1 text-[11px] leading-relaxed text-muted">
            <ShieldIcon className="mt-0.5 size-4 shrink-0 text-brand-dark" />
            Status diperbarui dari webhook penyedia. Tombol “Saya Sudah Bayar” hanya mengecek status, bukan mengubahnya.
          </p>
        </section>

        {expired ? (
          <p className="rounded-xl bg-danger-soft px-3 py-2.5 text-[11px] font-semibold text-danger">
            Batas pembayaran habis. Buat reservasi baru untuk mendapatkan nomor VA lagi.
          </p>
        ) : null}
      </div>
    </FlowScreen>
  );
}