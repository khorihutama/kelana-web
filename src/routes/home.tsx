import { Link, useNavigate } from '@tanstack/react-router';
import { useTrips, useCategories } from '@/queries';
import { session } from '@/lib/session';
import { SectionHeader, Skeleton, EmptyState, Badge } from '@/components/ui';
import { TripCard } from '@/components/TripCard';
import { TabBar, TabScreen } from '@/components/AppShell';
import { SearchIcon, TicketIcon, ArrowRight, InfoIcon } from '@/components/icons';

export function Home() {
  const trips = useTrips();
  const categories = useCategories();
  const navigate = useNavigate();
  const user = session.get()?.user;

  const open = trips.data?.data ?? [];
  const featured = open.slice(0, 3);
  const greeting = user?.name?.split(' ')[0] ?? 'Sahabat';

  return (
    <TabScreen>
      <header className="flex items-center justify-between gap-3 px-4 pt-5 pb-3">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold tracking-[0.14em] text-brand-dark uppercase">Kelana</p>
          <p className="text-[11px] font-semibold text-muted">Assalamualaikum,</p>
          <h1 className="truncate text-[19px] font-extrabold">{greeting}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Notifikasi, 3 baru"
            className="relative grid size-10 place-items-center rounded-full border border-line bg-surface text-body"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
              <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9z" strokeLinejoin="round" />
              <path d="M10 18a2 2 0 0 0 4 0" />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 grid size-[18px] place-items-center rounded-full bg-danger text-[10px] font-bold text-white">
              3
            </span>
          </button>
          <Link
            to="/profile"
            aria-label="Profil"
            className="grid size-10 place-items-center rounded-full bg-mint text-sm font-extrabold text-brand-dark"
          >
            {greeting.slice(0, 1).toUpperCase()}
          </Link>
        </div>
      </header>

      <div className="px-4">
        <button
          type="button"
          onClick={() => void navigate({ to: '/search', search: { q: '' } })}
          className="flex w-full items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-3 text-left text-[13px] text-muted"
        >
          <SearchIcon className="size-4 shrink-0 text-muted" />
          Mau ke mana? Cari destinasi atau trip
        </button>
      </div>

      <section className="mt-4 px-4">
        <div className="relative overflow-hidden rounded-2xl bg-brand-dark px-4 py-4 text-white">
          <svg viewBox="0 0 200 80" className="absolute inset-0 size-full opacity-20" aria-hidden preserveAspectRatio="none">
            <path d="M0 60c30-18 50 6 80-6s50-26 80-12 30 20 40 16v22H0z" fill="#fff" />
          </svg>
          <div className="relative space-y-1">
            <Badge tone="neutral">Promo</Badge>
            <p className="text-[15px] leading-snug font-extrabold">Safar dalam Sunnah, Ukhuwah dalam Perjalanan</p>
            <p className="text-[11px] text-white/85">Open trip Desember sudah dibuka. Kursi terbatas per keberangkatan.</p>
          </div>
        </div>
      </section>

      <section className="mt-5">
        <div className="px-4">
          <SectionHeader
            title="Sedang Dibuka"
            action={
              <Link to="/destinations" className="inline-flex items-center gap-1 text-xs font-bold text-brand-dark">
                Lihat semua <ArrowRight className="size-3.5" />
              </Link>
            }
          />
        </div>
        <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1">
          {trips.isPending
            ? Array.from({ length: 2 }).map((_, index) => <Skeleton key={index} className="h-[228px] w-[232px] shrink-0" />)
            : featured.map((trip) => <TripCard key={trip.id} trip={trip} layout="tile" />)}
        </div>
      </section>

      <section className="mt-6 px-4">
        <SectionHeader title="Kategori" />
        <div className="grid grid-cols-3 gap-2">
          {(categories.data?.data ?? []).map((category) => (
            <Link
              key={category.category}
              to="/destinations"
              search={{ category: category.category }}
              className="press rounded-xl border border-line bg-surface px-3 py-3 text-center"
            >
              <p className="text-[13px] font-bold capitalize">{category.category.toLowerCase()}</p>
              <p className="text-[11px] text-muted">{category.count} trip</p>
            </Link>
          ))}
          {categories.isPending
            ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-[64px]" />)
            : null}
        </div>
      </section>

      <section className="mt-6 px-4">
        <SectionHeader title="Trip pilihan" />
        {trips.isPending ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-[208px]" />
            ))}
          </div>
        ) : open.length === 0 ? (
          <EmptyState
            icon={<TicketIcon />}
            title="Belum ada Open Trip saat ini"
            description="Tim Kelana sedang menyiapkan rute & jadwal Open Trip. InsyaaAllah segera rilis."
          />
        ) : (
          <div className="space-y-3">
            {open.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 px-4">
        <div className="flex items-start gap-2.5 rounded-xl bg-canvas px-3.5 py-3 text-[11px] leading-relaxed text-muted">
          <InfoIcon className="mt-0.5 size-4 shrink-0 text-brand-dark" />
          <p>
            Harga yang tampil adalah harga per orang. Total akhir dihitung saat reservasi, termasuk hotel dan promo.
          </p>
        </div>
      </section>

      <TabBar />
    </TabScreen>
  );
}