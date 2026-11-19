import { useNavigate, useParams } from '@tanstack/react-router';
import { useState } from 'react';
import { useCompleteness, useCreatePayment, useReservation } from '@/queries';
import { formatIDR } from '@/lib/format';
import { FlowScreen } from '@/components/AppShell';
import { Badge, Button, EmptyState, Skeleton } from '@/components/ui';
import { Accordion } from '@/components/overlay';
import { RadioCard } from '@/components/form';
import { TimerChip } from '@/components/Timer';
import { BankIcon, CardIcon, InfoIcon, QrIcon } from '@/components/icons';
import type { PaymentMethod } from '@/lib/types';

const banks: { method: PaymentMethod; bank: string; note: string }[] = [
  { method: 'VA_BCA', bank: 'BCA', note: 'Virtual Account BCA' },
  { method: 'VA_MANDIRI', bank: 'Mandiri', note: 'Virtual Account Mandiri' },
  { method: 'VA_BSI', bank: 'BSI', note: 'Virtual Account BSI' },
];

export function CheckoutPage() {
  const { reservationId } = useParams({ from: '/checkout/$reservationId' });
  const navigate = useNavigate();
  const reservation = useReservation(reservationId);
  const completeness = useCompleteness(reservationId);
  const createPayment = useCreatePayment();
  const [method, setMethod] = useState<PaymentMethod>('VA_BCA');
  const [vaOpen, setVaOpen] = useState(true);

  if (reservation.isPending) {
    return (
      <FlowScreen title="Metode Pembayaran">
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-40" />
        </div>
      </FlowScreen>
    );
  }

  if (reservation.isError || !reservation.data) {
    return (
      <FlowScreen title="Metode Pembayaran">
        <EmptyState title="Reservasi tidak ditemukan" description="Kursi mungkin sudah dilepas. Pilih jadwal lagi." />
      </FlowScreen>
    );
  }

  const data = reservation.data.data;
  const complete = completeness.data?.data.complete ?? false;

  return (
    <FlowScreen
      title="Metode Pembayaran"
      subtitle={data.code}
      footer={
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-muted">Total bayar</span>
            <span className="text-[16px] font-extrabold text-brand-dark">{formatIDR(data.total_amount_idr)}</span>
          </div>
          <Button
            full
            size="lg"
            loading={createPayment.isPending}
            disabled={!complete}
            onClick={async () => {
              const result = await createPayment.mutateAsync({ reservationId, method });
              void navigate({
                to: '/pay/$paymentId',
                params: { paymentId: result.data.id },
                search: { reservation: reservationId },
              });
            }}
          >
            {complete ? 'Bayar Sekarang' : 'Dokumen belum lengkap'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <section className="card p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] text-muted">
                {data.participants.length} peserta · {data.code}
              </p>
              <p className="text-[13px] font-bold">Jadwal terpilih · {data.unit_price_idr ? formatIDR(data.unit_price_idr) : ''} / orang</p>
              <p className="text-[11px] text-muted">Jemput: {data.pickup_point}</p>
            </div>
            <TimerChip expiresAt={data.lock_expires_at} kind="LOCK" />
          </div>
          {!complete ? (
            <p className="mt-2 rounded-lg bg-warning-soft px-2.5 py-2 text-[11px] text-[#92400e]">
              Lengkapi dokumen di halaman reservasi sebelum membayar.
            </p>
          ) : null}
        </section>

        <section className="space-y-2">
          <Accordion
            title="Virtual Account"
            subtitle="BCA · Mandiri · BSI"
            icon={<BankIcon />}
            defaultOpen={vaOpen}
            right={<Badge tone="muted">Transfer</Badge>}
          >
            <div className="space-y-2">
              {banks.map((bank) => (
                <RadioCard
                  key={bank.method}
                  name="method"
                  checked={method === bank.method}
                  onChange={() => {
                    setMethod(bank.method);
                    setVaOpen(true);
                  }}
                  title={bank.bank}
                  subtitle={bank.note}
                />
              ))}
            </div>
          </Accordion>

          <Accordion title="E-Wallet / QRIS" subtitle="Scan sekali, langsung bayar" icon={<QrIcon />}>
            <RadioCard
              name="method"
              checked={method === 'QRIS'}
              onChange={() => setMethod('QRIS')}
              title="QRIS"
              subtitle="Semua aplikasi pembayaran yang mendukung QRIS"
            />
          </Accordion>

          <Accordion title="Kartu Kredit / Debit" subtitle="Visa · Mastercard" icon={<CardIcon />}>
            <RadioCard
              name="method"
              checked={method === 'CARD'}
              onChange={() => setMethod('CARD')}
              title="Kartu"
              subtitle="Kartu diproses di halaman penyedia pembayaran"
            />
          </Accordion>
        </section>

        <p className="flex items-start gap-2 rounded-xl bg-canvas px-3 py-2.5 text-[11px] leading-relaxed text-muted">
          <InfoIcon className="mt-0.5 size-4 shrink-0 text-brand-dark" />
          Kursi ditahan sampai lock 15 menit berakhir. Batas pembayaran adalah 24 jam setelah metode dibuat.
        </p>
      </div>
    </FlowScreen>
  );
}