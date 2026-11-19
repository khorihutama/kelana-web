import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { remainingSeconds } from '@/lib/format';
import { ClockIcon } from './icons';

export function useCountdown(expiresAt: string | undefined, onExpire?: () => void) {
  const [remaining, setRemaining] = useState(() => remainingSeconds(expiresAt));
  const fired = useRef(false);

  useEffect(() => {
    fired.current = false;
    setRemaining(remainingSeconds(expiresAt));
    if (!expiresAt) return;
    const id = window.setInterval(() => {
      const next = remainingSeconds(expiresAt);
      setRemaining(next);
      if (next === 0 && !fired.current) {
        fired.current = true;
        onExpire?.();
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt, onExpire]);

  return remaining;
}

export function TimerChip({
  expiresAt,
  kind,
  onExpire,
  compact,
}: {
  expiresAt: string | undefined;
  kind: 'LOCK' | 'PAYMENT';
  onExpire?: () => void;
  compact?: boolean;
}) {
  const remaining = useCountdown(expiresAt, onExpire);
  const urgent = remaining <= 60;
  const hours = Math.floor(remaining / 3600);
  const pad = (value: number) => String(value).padStart(2, '0');
  const label =
    kind === 'LOCK'
      ? `${pad(Math.floor(remaining / 60))}:${pad(remaining % 60)}`
      : `${pad(hours)}:${pad(Math.floor((remaining % 3600) / 60))}:${pad(remaining % 60)}`;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums',
        urgent ? 'bg-danger-soft text-danger' : kind === 'LOCK' ? 'bg-warning-soft text-[#92400e]' : 'bg-mint text-brand-dark',
      )}
      aria-label={`Sisa waktu ${label}`}
      role="timer"
    >
      <ClockIcon className="size-3.5" />
      {compact ? label : `${kind === 'LOCK' ? 'Lock' : 'Bayar'} ${label}`}
    </span>
  );
}