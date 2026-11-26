import { create } from 'zustand';
import { fetchAllUsers, fetchUser } from '../services/users';
import type { UserProfile } from '../types';

interface UsersState {
  users: Record<string, UserProfile>;
  loading: boolean;
  loaded: boolean;
  load: (force?: boolean) => Promise<void>;
  ensure: (uid: string) => void;
  upsert: (u: UserProfile) => void;
  reset: () => void;
}

const pending = new Set<string>();

export const useUsersStore = create<UsersState>((set, get) => ({
  users: {},
  loading: false,
  loaded: false,
  async load(force = false) {
    if (get().loading || (get().loaded && !force)) return;
    set({ loading: true });
    try {
      const list = await fetchAllUsers();
      set((s) => ({ users: { ...s.users, ...Object.fromEntries(list.map((u) => [u.uid, u])) }, loaded: true }));
    } finally {
      set({ loading: false });
    }
  },
  ensure(uid) {
    if (get().users[uid] || pending.has(uid)) return;
    pending.add(uid);
    void fetchUser(uid)
      .then((u) => u && get().upsert(u))
      .finally(() => pending.delete(uid));
  },
  upsert(u) {
    set((s) => ({ users: { ...s.users, [u.uid]: u } }));
  },
  reset() {
    set({ users: {}, loaded: false, loading: false });
  },
}));
