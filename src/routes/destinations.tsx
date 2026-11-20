import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useTrips } from '@/queries';
import { clearRecentSearches, getRecentSearches, pushRecentSearch } from '@/lib/recent';
import { TabBar, TabScreen } from '@/components/AppShell';
import { EmptyState, Skeleton } from '@/components/ui';
import { TripCard } from '@/components/TripCard';
import { CompassIcon, SearchIcon } from '@/components/icons';

// The API only returns OPEN / PRIVATE / EDU, so the chips follow that taxonomy.
const chips = [
  { value: 'ALL', label: 'Semua' },
  { value: 'OPEN', label: 'Open' },
  { value: 'PRIVATE', label: 'Private' },
  { value: 'EDU', label: 'Edu' },
] as const;

export function Destinations() {
  const navigate = useNavigate();
  const { category } = useSearch({ from: '/destinations' }) as { category?: string };
  const requested = category ?? 'ALL';
  const active = chips.some((chip) => chip.value === requested) ? requested : 'ALL';
  const trips = useTrips({ category: active === 'ALL' ? undefined : active });
  const [recent, setRecent] = useState<string[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setRecent(getRecentSearches());
  }, []);

  const list = trips.data?.data ?? [];

  return (
    <TabScreen>
      <header className="px-4 pt-5 pb-3">
        <h1 className="text-[19px] font-extrabold">Destinasi</h1>
        <p className="text-[12px] text-muted">Pilih rute, lihat jadwal, lalu kunci kursimu.</p>
      </header>

      <div className="px-4">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setRecent(pushRecentSearch(query));
            void navigate({ to: '/search', search: { q: query } });
          }}
        >
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari destinasi atau trip"
              aria-label="Cari destinasi"
              className="field pl-10"
            />
          </div>
        </form>
      </div>

      {recent.length > 0 ? (
        <section className="mt-4 px-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[13px] font-bold">Pencarian Terakhir</h2>
            <button
              type="button"
              onClick={() => setRecent(clearRecentSearches())}
              className="text-[11px] font-semibold text-muted"
            >
              Hapus
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recent.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => void navigate({ to: '/search', search: { q: term } })}
                className="rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] font-semibold text-body"
              >
                {term}
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="mt-4 px-4">
          <h2 className="mb-2 text-[13px] font-bold">Pencarian Terakhir</h2>
          <p className="rounded-xl border border-dashed border-line px-3 py-3 text-[11px] text-muted">
            Belum ada riwayat. Cari destinasi pertama kamu.
          </p>
        </section>
      )}

      <section className="mt-5">
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1">
          {chips.map((chip) => {
            const selected = active === chip.value;
            return (
              <Link
                key={chip.value}
                to="/destinations"
                search={chip.value === 'ALL' ? {} : { category: chip.value }}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[11px] font-bold ${
                  selected ? 'border-brand bg-brand text-white' : 'border-line bg-surface text-body'
                }`}
              >
                {chip.label}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-4 px-4">
        {trips.isPending ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-[200px]" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            icon={<CompassIcon />}
            title="Belum ada trip di kategori ini"
            description="Coba kategori lain, atau jelajah semua trip yang sedang dibuka."
            action={
              <Link to="/destinations" className="text-xs font-bold text-brand-dark">
                Lihat semua trip
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {list.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </section>

      <TabBar />
    </TabScreen>
  );
}