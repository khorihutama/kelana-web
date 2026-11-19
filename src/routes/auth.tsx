import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { session } from '@/lib/session';
import { signInSchema, signUpSchema, flattenIssues } from '@/lib/validation';
import { Button, Spinner } from '@/components/ui';
import { CheckboxField, TextField } from '@/components/form';
import { useToast } from '@/components/overlay';
import { ArrowRight, ShieldIcon } from '@/components/icons';
import { isMock } from '@/mocks/mode';

const MOCK = isMock();

export function Welcome() {
  const [language, setLanguage] = useState<'id' | 'en'>('id');
  const toast = useToast();

  return (
    <div className="shell relative overflow-hidden bg-brand-dark">
      <div className="absolute inset-0">
        <svg viewBox="0 0 400 700" className="size-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0F6D48" />
              <stop offset="100%" stopColor="#149C68" />
            </linearGradient>
          </defs>
          <rect width="400" height="700" fill="url(#sky)" />
          <path d="M-20 520c60-40 110 10 170-20s90-60 150-40 80 40 120 20v220H-20z" fill="#0b5136" opacity=".55" />
          <path d="M-20 570c70-30 120 10 180-10s90-40 140-25 70 30 120 15v170H-20z" fill="#0a3d29" opacity=".7" />
          <circle cx="316" cy="120" r="46" fill="#DEF4EC" opacity=".18" />
          <path
            d="M60 470c40-30 80 10 118-24s60-70 110-40"
            fill="none"
            stroke="#DEF4EC"
            strokeOpacity=".45"
            strokeWidth="2"
            strokeDasharray="6 8"
          />
        </svg>
      </div>

      <div className="relative z-10 flex flex-1 flex-col justify-between px-6 pt-10 pb-8">
        <div className="space-y-4 text-white">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-[11px] font-bold tracking-wide uppercase">
            <ShieldIcon className="size-3.5" /> Open · Private · Edu
          </span>
          <h1 className="text-[32px] leading-[1.15] font-extrabold text-white">
            Your Journey
            <br />
            Starts Here
          </h1>
          <p className="max-w-[30ch] text-sm leading-relaxed text-white/80">
            Jelajah open trip, private trip, dan edu trip. Kursi dikunci aman 15 menit sampai kamu selesai mengisi data.
          </p>
        </div>

        <div className="space-y-4">
          <div className="inline-flex rounded-full bg-white/12 p-1 text-[11px] font-bold text-white">
            {(['id', 'en'] as const).map((code) => (
              <button
                key={code}
                type="button"
                aria-pressed={language === code}
                onClick={() => {
                  setLanguage(code);
                  if (code === 'en') {
                    toast.push('Salinan English belum tersedia; antarmuka tetap Bahasa Indonesia.', 'info');
                  }
                }}
                className={`rounded-full px-3 py-1.5 ${language === code ? 'bg-white text-brand-dark' : 'text-white/80'}`}
              >
                {code === 'id' ? 'Indonesia' : 'English'}
              </button>
            ))}
          </div>

          <div className="space-y-2.5 rounded-2xl bg-white p-4">
            <Link to="/signup">
              <Button full size="lg" icon={<ArrowRight className="size-4" />}>
                Mulai Sekarang
              </Button>
            </Link>
            <Link to="/signin" className="block">
              <Button full size="lg" variant="outline">
                Sudah punya akun? Masuk
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SignIn() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function submit() {
    const parsed = signInSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(flattenIssues(parsed.error));
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const result = await api.login(form);
      session.set({ accessToken: result.data.access_token, user: result.data.user });
      await navigate({ to: '/home' });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Gagal masuk. Coba lagi.';
      setErrors({ password: message });
      toast.push(message, 'error');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="shell px-5 py-6">
      <header className="mb-8 space-y-2">
        <p className="text-xs font-bold tracking-wide text-brand-dark uppercase">HSI GO</p>
        <h1 className="text-[26px] leading-tight font-extrabold">Masuk ke akunmu</h1>
        <p className="text-sm text-muted">Lanjutkan perjalanan yang sudah kamu rencanakan.</p>
      </header>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="nama@email.com"
          value={form.email}
          error={errors.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
        <TextField
          label="Kata Sandi"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Minimal 8 karakter"
          value={form.password}
          error={errors.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
        />

        <Button type="submit" full size="lg" loading={pending}>
          Masuk
        </Button>
      </form>

      {MOCK ? (
        <p className="mt-4 rounded-xl bg-mint/60 px-3 py-2.5 text-[11px] leading-relaxed text-brand-dark">
          Mode mock: <strong>fulan@hsigo.id</strong> / <strong>Password123</strong>
        </p>
      ) : null}

      <p className="mt-6 text-center text-[13px] text-muted">
        Belum punya akun?{' '}
        <Link to="/signup" className="link">
          Daftar
        </Link>
      </p>
    </div>
  );
}

export function SignUp() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', terms: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function submit() {
    const parsed = signUpSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(flattenIssues(parsed.error));
      return;
    }
    setErrors({});
    setPending(true);
    try {
      await api.register({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      await navigate({ to: '/verify', search: { email: form.email } });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Pendaftaran gagal. Coba lagi.';
      toast.push(message, 'error');
      setErrors({ email: message });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="shell px-5 py-6">
      <header className="mb-7 space-y-2">
        <p className="text-xs font-bold tracking-wide text-brand-dark uppercase">HSI GO</p>
        <h1 className="text-[26px] leading-tight font-extrabold">Buat akun baru</h1>
        <p className="text-sm text-muted">Satu akun untuk semua trip dan dokumen perjalananmu.</p>
      </header>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <TextField
          label="Nama Lengkap"
          name="name"
          autoComplete="name"
          placeholder="Nama sesuai KTP"
          value={form.name}
          error={errors.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="nama@email.com"
          value={form.email}
          error={errors.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
        <TextField
          label="Kata Sandi"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Minimal 8 karakter"
          value={form.password}
          error={errors.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
        />
        <TextField
          label="Ulangi Kata Sandi"
          name="confirm"
          type="password"
          autoComplete="new-password"
          placeholder="Ulangi kata sandi"
          value={form.confirm}
          error={errors.confirm}
          onChange={(event) => setForm({ ...form, confirm: event.target.value })}
        />
        <CheckboxField
          checked={form.terms}
          error={errors.terms}
          onChange={(terms) => setForm({ ...form, terms })}
          label={
            <>
              Saya sudah membaca dan menyetujui <span className="font-bold text-brand-dark">syarat &amp; kebijakan</span> HSI GO.
            </>
          }
        />

        <Button type="submit" full size="lg" loading={pending}>
          Daftar
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-muted">
        Sudah punya akun?{' '}
        <Link to="/signin" className="link">
          Masuk
        </Link>
      </p>
    </div>
  );
}

export function Verify() {
  const navigate = useNavigate();
  const toast = useToast();
  const { email } = useSearch({ from: '/verify' }) as { email?: string };
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(15);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  const code = digits.join('');

  async function submit() {
    if (code.length !== 6) {
      setError('Masukkan 6 digit kode.');
      return;
    }
    setPending(true);
    setError('');
    try {
      const result = await api.verifyEmail({ email: email ?? '', code });
      session.set({ accessToken: result.data.access_token, user: result.data.user });
      toast.push('Email terverifikasi. Selamat datang!');
      await navigate({ to: '/home' });
    } catch (caught) {
      const message = caught instanceof ApiError ? caught.message : 'Verifikasi gagal.';
      setError(message);
      toast.push(message, 'error');
    } finally {
      setPending(false);
    }
  }

  function setDigit(index: number, value: string) {
    const clean = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (clean && index < 5) inputs.current[index + 1]?.focus();
  }

  function onPaste(value: string) {
    const clean = value.replace(/\D/g, '').slice(0, 6);
    if (!clean) return;
    const next = clean.split('');
    setDigits([...next, ...Array(6 - next.length).fill('')] as string[]);
    inputs.current[Math.min(clean.length, 5)]?.focus();
  }

  async function resend() {
    if (cooldown > 0) return;
    try {
      await api.resendVerification({ email: email ?? '' });
      setCooldown(15);
      toast.push('Kode baru dikirim ke emailmu.');
    } catch {
      toast.push('Gagal mengirim ulang kode.', 'error');
    }
  }

  return (
    <div className="shell px-5 py-6">
      <header className="mb-8 space-y-2">
        <p className="text-xs font-bold tracking-wide text-brand-dark uppercase">Verification</p>
        <h1 className="text-[26px] leading-tight font-extrabold">Cek emailmu</h1>
        <p className="text-sm text-muted">
          Kami mengirim 6 digit kode ke <span className="font-bold text-ink">{email ?? 'emailmu'}</span>.
        </p>
      </header>

      <div className="flex justify-between gap-2" role="group" aria-label="Kode verifikasi 6 digit">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              inputs.current[index] = element;
            }}
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label={`Digit ${index + 1}`}
            value={digit}
            onChange={(event) => setDigit(index, event.target.value)}
            onPaste={(event) => {
              event.preventDefault();
              onPaste(event.clipboardData.getData('text'));
            }}
            onKeyDown={(event) => {
              if (event.key === 'Backspace' && !digit && index > 0) inputs.current[index - 1]?.focus();
            }}
            className="field h-14 w-full text-center text-xl font-bold"
            maxLength={1}
          />
        ))}
      </div>
      {error ? (
        <p className="error-text" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex items-center justify-between text-[13px] text-muted">
        <span>Belum menerima kode?</span>
        <button
          type="button"
          onClick={() => void resend()}
          disabled={cooldown > 0}
          className="font-bold text-brand-dark disabled:text-disabled"
        >
          {cooldown > 0 ? `Kirim ulang (00:${String(cooldown).padStart(2, '0')})` : 'Kirim ulang'}
        </button>
      </div>

      <Button full size="lg" className="mt-6" loading={pending} onClick={() => void submit()}>
        Verifikasi
      </Button>

      <div className="mt-6 flex items-start gap-2 rounded-xl bg-mint/50 px-3 py-2.5 text-[11px] leading-relaxed text-brand-dark">
        <ShieldIcon className="mt-0.5 size-4 shrink-0" />
        <p>
          Kode berlaku terbatas dan tidak boleh dibagikan. {MOCK ? 'Di mode mock, kode yang diterima adalah 123456.' : ''}
        </p>
      </div>

      {pending ? (
        <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted">
          <Spinner className="text-brand" /> Memverifikasi...
        </p>
      ) : null}
    </div>
  );
}