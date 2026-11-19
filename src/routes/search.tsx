import { useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useTrips } from '@/queries';
import { clearRecentSearches, getRecentSearches, pushRecentSearch } from '@/lib/recent';
import { FlowScreen } from '@/components/AppShell';
import { EmptyState, Skeleton } from '@/components/ui';
import { TripCard } from '@/components/TripCard';
import { SearchIcon } from '@/components/icons';

const suggestions = ['bromo', 'jawa tengah', 'pantai', 'gunung'];

export function SearchPage() {
  const navigate = useNavigate();
  const { q } = useSearch({ from: '/search' }) as { q?: string };
  const [term, setTerm] = useState(q ?? '');
  const [recent, setRecent] = useState<string[]>([]);
  const debounce = useRef<number | undefined>(undefined);

  useEffect(() => {
    setRecent(getRecentSearches());
  }, []);

  useEffect(() => {
    setTerm(q ?? '');
  }, [q]);

  useEffect(() => {
    window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => {
      if ((q ?? '') !== term) {
        void navigate({ to: '/search', search: { q: term }, replace: true });
      }
    }, 300);
    return () => window.clearTimeout(debounce.current);
  }, [term, q, navigate]);

  const trimmed = term.trim();
  const trips = useTrips({ q: trimmed });
  const results = trips.data?.data ?? [];
  const idle = trimmed.length < 2;

  function submit(value: string) {
    setTerm(value);
    setRecent(pushRecentSearch(value));
    void navigate({ to: '/search', search: { q: value } });
  }

  return (
    <FlowScreen>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(term);
        }}
      >
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
          <input
            autoFocus
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Cari Jogja, Bromo, pantai..."
            aria-label="Kata kunci pencarian"
            className="field pr-10 pl-10"
          />
          {term ? (
            <button
              type="button"
              aria-label="Hapus pencarian"
              onClick={() => {
                setTerm('');
                void navigate({ to: '/search', search: { q: '' }, replace: true });
              }}
              className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted"
            >
              ×
            </button>
          ) : null}
        </div>
      </form>

      {idle ? (
        <div className="mt-5 space-y-6">
          <section>
            <h2 className="mb-2 text-[13px] font-bold">Rekomendasi Pencarian</h2>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => submit(item)}
                  className="rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] font-semibold text-body"
                >
                  {item}
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[13px] font-bold">Pencarian Terakhir</h2>
              {recent.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setRecent(clearRecentSearches())}
                  className="text-[11px] font-semibold text-muted"
                >
                  Hapus
                </button>
              ) : null}
            </div>
            {recent.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line px-3 py-3 text-[11px] text-muted">
                Belum ada riwayat pencarian.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {recent.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => submit(item)}
                    className="rounded-full bg-canvas px-3 py-1.5 text-[11px] font-semibold text-body"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : trips.isPending ? (
        <div className="mt-5 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-[200px]" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<SearchIcon />}
            title="Tidak ada hasil"
            description={`Tidak ada trip yang cocok dengan "${trimmed}". Coba kata kunci lain atau jelajah semua destinasi.`}
            action={
              <button
                type="button"
                onClick={() => {
                  setTerm('');
                  void navigate({ to: '/destinations' });
                }}
                className="text-xs font-bold text-brand-dark"
              >
                Reset pencarian
              </button>
            }
          />
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          <p className="text-[12px] font-semibold text-muted">{results.length} Hasil Pencarian</p>
          {results.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </FlowScreen>
  );
}