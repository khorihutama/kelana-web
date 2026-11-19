import { clsx } from 'clsx';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { CheckIcon, ChevronDown, TrashIcon } from './icons';
import { formatBytes } from '@/lib/format';
import { Spinner } from './ui';

interface FieldShellProps {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}

export function FieldShell({ label, htmlFor, error, hint, optional, children }: FieldShellProps) {
  return (
    <div>
      {label ? (
        <label className="label" htmlFor={htmlFor}>
          {label}
          {optional ? <span className="ml-1 font-normal text-muted">(opsional)</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="error-text" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="hint">{hint}</p>
      ) : null}
    </div>
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  optional?: boolean;
}

export function TextField({ label, error, hint, optional, className, id, ...rest }: TextFieldProps) {
  const inputId = id ?? rest.name;
  return (
    <FieldShell label={label} htmlFor={inputId} error={error} hint={hint} optional={optional}>
      <input
        id={inputId}
        {...rest}
        aria-invalid={Boolean(error)}
        className={clsx('field', error && 'field-invalid', className)}
      />
    </FieldShell>
  );
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  optional?: boolean;
}

export function TextAreaField({ label, error, hint, optional, className, id, rows = 3, ...rest }: TextAreaFieldProps) {
  const inputId = id ?? rest.name;
  return (
    <FieldShell label={label} htmlFor={inputId} error={error} hint={hint} optional={optional}>
      <textarea
        id={inputId}
        rows={rows}
        {...rest}
        aria-invalid={Boolean(error)}
        className={clsx('field resize-none', error && 'field-invalid', className)}
      />
    </FieldShell>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function SelectField({ label, error, hint, className, id, children, ...rest }: SelectFieldProps) {
  const inputId = id ?? rest.name;
  return (
    <FieldShell label={label} htmlFor={inputId} error={error} hint={hint}>
      <div className="relative">
        <select
          id={inputId}
          {...rest}
          aria-invalid={Boolean(error)}
          className={clsx('field appearance-none pr-10', error && 'field-invalid', className)}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted" />
      </div>
    </FieldShell>
  );
}

export function CheckboxField({
  label,
  checked,
  onChange,
  error,
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-snug text-body">
        <span
          className={clsx(
            'mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-[5px] border transition-colors',
            checked ? 'border-brand bg-brand text-white' : 'border-line bg-surface',
            error && !checked && 'border-danger',
          )}
        >
          {checked ? <CheckIcon className="size-3" /> : null}
        </span>
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span>{label}</span>
      </label>
      {error ? (
        <p className="error-text" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function RadioCard({
  name,
  checked,
  onChange,
  title,
  subtitle,
  meta,
  children,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  subtitle?: string;
  meta?: string;
  children?: ReactNode;
}) {
  return (
    <label
      className={clsx(
        'press block cursor-pointer rounded-xl border p-3.5 transition-colors',
        checked ? 'border-brand bg-mint/40' : 'border-line bg-surface hover:border-brand-light',
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={clsx(
            'mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full border',
            checked ? 'border-brand' : 'border-line',
          )}
        >
          {checked ? <span className="size-2.5 rounded-full bg-brand" /> : null}
        </span>
        <input type="radio" name={name} className="sr-only" checked={checked} onChange={onChange} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-bold">{title}</p>
            {meta ? <span className="text-xs font-semibold text-muted">{meta}</span> : null}
          </div>
          {subtitle ? <p className="mt-0.5 text-xs leading-relaxed text-muted">{subtitle}</p> : null}
          {children}
        </div>
      </div>
    </label>
  );
}

export function Stepper({
  value,
  min = 0,
  max = 10,
  onChange,
  label,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-bold">{label}</p>
        <p className="text-xs text-muted">
          {value} peserta{value > 0 ? ` · ${Math.min(max, value)} dari ${max}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Kurangi peserta"
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="grid size-9 place-items-center rounded-full border border-line text-lg font-bold text-body disabled:text-disabled"
        >
          -
        </button>
        <span aria-live="polite" className="w-6 text-center text-sm font-bold">
          {value}
        </span>
        <button
          type="button"
          aria-label="Tambah peserta"
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          className="grid size-9 place-items-center rounded-full border border-brand bg-brand text-lg font-bold text-white disabled:border-line disabled:bg-canvas disabled:text-disabled"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function UploadItem({
  fileName,
  sizeBytes,
  progress,
  onRemove,
  error,
}: {
  fileName: string;
  sizeBytes: number;
  progress: number;
  onRemove: () => void;
  error?: string;
}) {
  const done = progress >= 100 && !error;
  return (
    <div
      className={clsx(
        'flex items-center gap-3 rounded-xl border p-3',
        error ? 'border-danger bg-danger-soft/40' : 'border-line bg-canvas',
      )}
    >
      <div
        className={clsx(
          'grid size-9 shrink-0 place-items-center rounded-lg text-[10px] font-bold uppercase',
          done ? 'bg-mint text-brand-dark' : 'bg-surface text-muted',
        )}
      >
        {fileName.split('.').pop()?.slice(0, 4) ?? 'file'}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold">{fileName}</p>
        <div className="mt-1 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-line">
            <div
              className={clsx('h-full rounded-full transition-[width]', error ? 'bg-danger' : 'bg-brand')}
              style={{ width: `${error ? 100 : progress}%` }}
            />
          </div>
          <span className="text-[10px] font-semibold text-muted">
            {error ? 'gagal' : done ? formatBytes(sizeBytes) : `${progress}%`}
          </span>
        </div>
        {error ? <p className="mt-1 text-[10px] font-semibold text-danger">{error}</p> : null}
      </div>
      {done || error ? (
        <button
          type="button"
          aria-label={`Hapus ${fileName}`}
          onClick={onRemove}
          className="grid size-8 place-items-center rounded-full text-muted hover:bg-surface"
        >
          <TrashIcon className="size-4" />
        </button>
      ) : (
        <Spinner className="text-brand" />
      )}
    </div>
  );
}