import { clsx } from 'clsx';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CheckIcon, CloseIcon, InfoIcon } from './icons';

/* ---------------------------------- Modal --------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  dismissible = true,
  label,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  dismissible?: boolean;
  label?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissible) onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, dismissible, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Tutup"
        tabIndex={-1}
        onClick={() => dismissible && onClose()}
        className="absolute inset-0 bg-[#07112A]/45"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label ?? title}
        className="animate-rise safe-bottom relative z-10 w-full max-w-[480px] rounded-t-3xl bg-surface sm:rounded-3xl"
      >
        <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-2">
          <div>
            <h2 className="text-[17px] font-bold">{title}</h2>
          </div>
          {dismissible ? (
            <button
              type="button"
              aria-label="Tutup dialog"
              onClick={onClose}
              className="grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas"
            >
              <CloseIcon className="size-4" />
            </button>
          ) : null}
        </header>
        <div className="max-h-[65dvh] overflow-y-auto px-5 pb-4">{children}</div>
        {footer ? <div className="border-t border-line-soft px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}

/* ---------------------------------- Toast --------------------------------- */

type Tone = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  tone: Tone;
}

const ToastContext = createContext<{ push: (message: string, tone?: Tone) => void }>({ push: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, tone: Tone = 'success') => {
    const id = Date.now() + Math.random();
    setItems([{ id, message, tone }]);
    window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id));
    }, 3800);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4">
        <div aria-live="polite" className="flex w-full max-w-[420px] flex-col gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={clsx(
                'animate-rise pointer-events-auto flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-[13px] font-semibold text-white shadow-lg',
                item.tone === 'success' && 'bg-brand-dark',
                item.tone === 'error' && 'bg-danger',
                item.tone === 'info' && 'bg-[#1f2937]',
              )}
            >
              <span className="mt-0.5">
                {item.tone === 'success' ? (
                  <CheckIcon className="size-4" />
                ) : item.tone === 'error' ? (
                  <CloseIcon className="size-4" />
                ) : (
                  <InfoIcon className="size-4" />
                )}
              </span>
              <span className="leading-snug">{item.message}</span>
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

/* -------------------------------- Accordion ------------------------------- */

export function Accordion({
  title,
  subtitle,
  icon,
  defaultOpen = false,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  right?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-line bg-surface">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
      >
        {icon ? <span className="grid size-9 place-items-center rounded-lg bg-canvas text-brand-dark">{icon}</span> : null}
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold">{title}</span>
          {subtitle ? <span className="block text-xs text-muted">{subtitle}</span> : null}
        </span>
        {right}
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className={clsx('size-4 shrink-0 text-muted transition-transform', open && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="m5 9 7 7 7-7" />
        </svg>
      </button>
      {open ? <div className="border-t border-line-soft px-3.5 py-3">{children}</div> : null}
    </div>
  );
}