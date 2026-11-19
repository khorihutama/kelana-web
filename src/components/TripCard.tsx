import { clsx } from 'clsx';
import { Link } from '@tanstack/react-router';
import type { TripCard as TripCardType } from '@/lib/types';
import { formatDateShort, formatIDR } from '@/lib/format';
import { Badge } from './ui';
import { CalendarIcon, ClockIcon, StarIcon } from './icons';

const palettes = [
  ['#0F6D48', '#4FBF94'],
  ['#13337E', '#4470DB'],
  ['#0F6D48', '#149C68'],
  ['#1f3b2d', '#7fc8a9'],
  ['#123a5a', '#5aa9d6'],
  ['#4a3210', '#c9a15c'],
] as const;

export function paletteFor(seed: string): readonly [string, string] {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) % 997;
  return palettes[hash % palettes.length]!;
}

export function TripImage({
  slug,
  city,
  className,
  label = true,
}: {
  slug: string;
  city: string;
  className?: string;
  label?: boolean;
}) {
  const [from, to] = paletteFor(slug);
  return (
    <div
      role="img"
      aria-label={`Ilustrasi ${city}`}
      className={clsx('relative overflow-hidden', className)}
      style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
    >
      <svg className="absolute inset-0 size-full opacity-25" aria-hidden viewBox="0 0 200 120" preserveAspectRatio="none">
        <path d="M0 96c30-26 48 6 76-12s34-30 60-20 40 28 64 22v34H0z" fill="#ffffff" opacity=".35" />
        <path d="M0 108c34-18 52 4 82-8s40-22 62-12 34 18 56 14v18H0z" fill="#ffffff" opacity=".45" />
        <circle cx="162" cy="26" r="12" fill="#ffffff" opacity=".5" />
      </svg>
      {label ? (
        <span className="absolute bottom-2 left-3 text-[11px] font-bold tracking-wide text-white/90 uppercase">
          {city}
        </span>
      ) : null}
    </div>
  );
}

export function TripCard({
  trip,
  layout = 'list',
}: {
  trip: TripCardType;
  layout?: 'list' | 'tile';
}) {
  const price = formatIDR(trip.base_price_idr);
  const seats = trip.seats_available ?? 0;

  return (
    <Link
      to="/trips/$slug"
      params={{ slug: trip.slug }}
      className={clsx(
        'press block overflow-hidden rounded-2xl border border-line bg-surface transition-shadow hover:shadow-[0_6px_20px_rgba(7,17,42,0.06)]',
        layout === 'tile' ? 'w-[232px] shrink-0' : '',
      )}
      data-testid="trip-card"
    >
      <div className={clsx('relative', layout === 'tile' ? 'h-[104px]' : 'h-[112px]')}>
        <TripImage slug={trip.slug} city={trip.destination_city} className="size-full" />
        <span className="absolute top-2 left-2">
          <Badge tone="neutral">{trip.category}</Badge>
        </span>
        {seats > 0 && seats <= 3 ? (
          <span className="absolute top-2 right-2">
            <Badge tone="warning">Sisa {seats} kursi</Badge>
          </span>
        ) : null}
      </div>
      <div className="space-y-1.5 p-3">
        <h3 className="line-clamp-2 text-[13px] leading-snug font-bold text-ink-strong">{trip.title}</h3>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted">
          {trip.next_departure ? (
            <span className="inline-flex items-center gap-1">
              <CalendarIcon className="size-3.5" />
              {formatDateShort(trip.next_departure)}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <ClockIcon className="size-3.5" />
            {trip.duration_days} hari
          </span>
          {trip.rating_avg ? (
            <span className="inline-flex items-center gap-0.5 text-[#b45309]">
              <StarIcon className="size-3" />
              {trip.rating_avg.toFixed(1)}
            </span>
          ) : null}
        </div>
        <div className="flex items-baseline justify-between gap-2 pt-0.5">
          <p className="text-[13px] font-bold text-brand-dark">
            {price}
            <span className="ml-1 text-[10px] font-medium text-muted">/orang</span>
          </p>
          <span className="text-[10px] font-semibold text-muted">{trip.departure_city}</span>
        </div>
      </div>
    </Link>
  );
}