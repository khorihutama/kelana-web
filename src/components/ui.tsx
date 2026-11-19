import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  full?: boolean;
  icon?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark disabled:bg-disabled',
  secondary: 'bg-blue text-white hover:bg-blue-accent disabled:bg-disabled',
  outline: 'border border-line bg-surface text-ink hover:border-brand hover:text-brand-dark disabled:text-disabled',
  ghost: 'text-brand-dark hover:bg-mint disabled:text-disabled',
  danger: 'bg-danger text-white hover:bg-[#b91c1c] disabled:bg-disabled',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-xs',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-[15px]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  full = false,
  icon,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || loading}
      className={clsx(
        'press inline-flex items-center justify-center gap-2 rounded-full font-bold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-100',
        variants[variant],
        sizes[size],
        full && 'w-full',
        className,
      )}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={clsx(
        'inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent align-[-2px]',
        className,
      )}
    />
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'brand' | 'blue' | 'warning' | 'danger' | 'muted';
}) {
  const tones = {
    neutral: 'bg-canvas text-body',
    brand: 'bg-mint text-brand-dark',
    blue: 'bg-[#DEE2F4] text-blue',
    warning: 'bg-warning-soft text-[#92400e]',
    danger: 'bg-danger-soft text-danger',
    muted: 'bg-line-soft text-muted',
  } as const;
  return <span className={clsx('pill', tones[tone])}>{children}</span>;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="animate-rise flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-surface px-6 py-10 text-center">
      {icon ? <div className="grid size-12 place-items-center rounded-full bg-mint text-brand-dark">{icon}</div> : null}
      <div className="space-y-1">
        <h3 className="text-[15px] font-bold">{title}</h3>
        <p className="mx-auto max-w-[36ch] text-[13px] leading-relaxed text-muted">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={clsx('skeleton rounded-xl', className)} />;
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="section-title">{title}</h2>
      {action}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={clsx('divider', className)} />;
}