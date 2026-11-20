import { useNavigate } from '@tanstack/react-router';
import { api } from '@/lib/api';
import { session } from '@/lib/session';
import { initials } from '@/lib/format';
import { TabBar, TabScreen } from '@/components/AppShell';
import { Badge, Divider } from '@/components/ui';
import { useToast } from '@/components/overlay';
import { ChevronLeft, ShieldIcon } from '@/components/icons';
import { useMe } from '@/queries';

const groups: { title: string; items: { label: string; soon?: boolean }[] }[] = [
  {
    title: 'Pengaturan Akun',
    items: [{ label: 'Edit Profile' }, { label: 'Ulasan', soon: true }, { label: 'Preferensi Perjalanan', soon: true }],
  },
  {
    title: 'Pengaturan Aplikasi',
    items: [{ label: 'Notifikasi', soon: true }, { label: 'Bahasa', soon: true }, { label: 'Privasi', soon: true }],
  },
  {
    title: 'Bantuan',
    items: [{ label: 'Pusat Bantuan', soon: true }, { label: 'Hubungi Kami', soon: true }, { label: 'Tentang Aplikasi' }],
  },
];

export function ProfilePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const me = useMe();
  const user = me.data?.data ?? session.get()?.user;

  async function logout() {
    try {
      await api.logout();
    } catch {
      /* clearing locally is enough */
    }
    session.clear();
    toast.push('Kamu sudah keluar.');
    await navigate({ to: '/welcome' });
  }

  return (
    <TabScreen>
      <header className="px-4 pt-5 pb-3">
        <h1 className="text-[19px] font-extrabold">Profil</h1>
      </header>

      <section className="px-4">
        <div className="card flex items-center gap-3 p-4">
          <span className="grid size-12 place-items-center rounded-full bg-brand text-[15px] font-extrabold text-white">
            {initials(user?.name ?? 'Kelana')}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold">{user?.name ?? 'Pengguna'}</p>
            <p className="truncate text-[11px] text-muted">{user?.email ?? '-'}</p>
            {user?.email_verified_at ? (
              <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-brand-dark">
                <ShieldIcon className="size-3" /> Email terverifikasi
              </span>
            ) : null}
          </div>
        </div>
      </section>

      {groups.map((group) => (
        <section key={group.title} className="mt-4 px-4">
          <h2 className="mb-2 text-[12px] font-bold text-muted">{group.title}</h2>
          <div className="card divide-y divide-line-soft">
            {group.items.map((item) => (
              <div key={item.label} className="flex items-center justify-between px-4 py-3">
                <span className={`text-[13px] ${item.soon ? 'text-muted' : 'font-semibold'}`}>{item.label}</span>
                {item.soon ? <Badge tone="muted">Segera</Badge> : <ChevronLeft className="size-4 rotate-180 text-muted" />}
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="mt-4 px-4">
        <h2 className="mb-2 text-[12px] font-bold text-muted">Danger Zone</h2>
        <div className="card divide-y divide-line-soft">
          <button type="button" onClick={() => void logout()} className="w-full px-4 py-3 text-left text-[13px] font-bold text-danger">
            Log Out
          </button>
          <button
            type="button"
            disabled
            className="flex w-full items-center justify-between px-4 py-3 text-left text-[13px] text-disabled"
          >
            Hapus Akun <Badge tone="muted">Hubungi admin</Badge>
          </button>
        </div>
      </section>

      <div className="px-4 py-5">
        <Divider />
        <p className="mt-3 text-center text-[10px] text-muted">Kelana · versi 0.1.0 · dibuat dari PRD + desain Figma</p>
      </div>

      <TabBar />
    </TabScreen>
  );
}