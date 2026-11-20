import { clsx } from 'clsx';
import { Link, useRouter } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { ChevronLeft } from './icons';

export function AppHeader({
  title,
  subtitle,
  back,
  action,
  transparent,
}: {
  title?: string;
  subtitle?: string;
  back?: boolean;
  action?: ReactNode;
  transparent?: boolean;
}) {
  const router = useRouter();
  return (
    <header
      className={clsx(
        'sticky top-0 z-30 flex items-center gap-2 px-4 py-3',
        transparent ? 'bg-transparent' : 'border-b border-line-soft bg-surface/95 backdrop-blur',
      )}
    >
      {back ? (
        <button
          type="button"
          aria-label="Kembali"
          onClick={() => router.history.back()}
          className="-ml-1.5 grid size-9 place-items-center rounded-full text-ink hover:bg-canvas"
        >
          <ChevronLeft className="size-5" />
        </button>
      ) : null}
      <div className="min-w-0 flex-1">
        {title ? <h1 className="truncate text-[16px] font-bold">{title}</h1> : null}
        {subtitle ? <p className="truncate text-[11px] text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </header>
  );
}

const tabs = [
  { to: '/home' as const, label: 'Home', icon: 'home' },
  { to: '/destinations' as const, label: 'Destinasi', icon: 'compass' },
  { to: '/mytrips' as const, label: 'Tripku', icon: 'ticket' },
  { to: '/profile' as const, label: 'Profil', icon: 'user' },
];

function TabIcon({ name, active }: { name: string; active: boolean }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: active ? 2 : 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  if (name === 'home')
    return (
      <svg {...common}>
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z" />
      </svg>
    );
  if (name === 'compass')
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="m14.8 9.2-1.6 4-4 1.6 1.6-4z" />
      </svg>
    );
  if (name === 'ticket')
    return (
      <svg {...common}>
        <path d="M4 9V7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a2.5 2.5 0 0 0 0 5v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a2.5 2.5 0 0 0 0-5z" />
      </svg>
    );
  return (
    <svg {...common}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c0-3.4 3.1-5.5 7-5.5s7 2.1 7 5.5" />
    </svg>
  );
}

export function TabBar() {
  return (
    <nav
      aria-label="Navigasi utama"
      className="safe-bottom fixed inset-x-0 bottom-0 z-30 mx-auto mt-auto w-full max-w-[480px] border-t border-line bg-surface/95 backdrop-blur md:static"
    >
      <ul className="grid grid-cols-4">
        {tabs.map((tab) => (
          <li key={tab.to}>
            <Link
              to={tab.to}
              className="flex flex-col items-center gap-1 py-2 text-[10px] font-bold text-muted"
              activeProps={{ className: 'flex flex-col items-center gap-1 py-2 text-[10px] font-bold text-brand-dark' }}
              data-testid={`tab-${tab.label.toLowerCase()}`}
            >
              {({ isActive }) => (
                <>
                  <TabIcon name={tab.icon} active={isActive} />
                  {tab.label}
                </>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function TabScreen({ children }: { children: ReactNode }) {
  return (
    <div data-testid="tab-screen" className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col pb-20 md:pb-0">
      {children}
    </div>
  );
}

export function FlowScreen({
  title,
  subtitle,
  children,
  footer,
  back = true,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  back?: boolean;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">
      <AppHeader title={title} subtitle={subtitle} back={back} />
      <main className="flex-1 px-4 py-4">{children}</main>
      {footer ? (
        <div className="safe-bottom sticky bottom-0 border-t border-line-soft bg-surface/95 px-4 py-3 backdrop-blur">
          {footer}
        </div>
      ) : null}
    </div>
  );
}