import type { User } from './types';

const STORAGE_KEY = 'kelana.session';

export interface Session {
  accessToken: string;
  user: User;
}

type Listener = (session: Session | null) => void;

let current: Session | null = read();

const listeners = new Set<Listener>();

function read(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.accessToken || !parsed?.user) return null;
    return parsed;
  } catch {
    return null;
  }
}

function write(session: Session | null) {
  current = session;
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* private mode: keep in memory only */
  }
  for (const listener of listeners) listener(session);
}

export const session = {
  get: () => current,
  set(next: Session) {
    write(next);
  },
  updateUser(user: User) {
    if (current) write({ ...current, user });
  },
  setAccessToken(accessToken: string) {
    if (current) write({ ...current, accessToken });
  },
  clear() {
    write(null);
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};