import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { ensureUserDoc } from '../services/auth';
import { startPresence } from '../services/presence';
import { toProfile } from '../services/users';
import { registerPush, pushSupported } from '../services/push';
import { useUsersStore } from './usersStore';
import type { UserProfile } from '../types';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, profile: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const upsert = useUsersStore((s) => s.upsert);

  useEffect(() => onAuthStateChanged(auth, (u) => {
    setUser(u);
    if (!u) {
      setProfile(null);
      setLoading(false);
    }
  }), []);

  useEffect(() => {
    if (!user) return;
    const uid = user.uid;
    let stopPresence: (() => void) | undefined;
    let cancelled = false;
    const unsub = onSnapshot(doc(db, 'users', uid), (snap) => {
      if (snap.exists()) {
        const p = toProfile(uid, snap.data());
        setProfile(p);
        upsert(p);
        setLoading(false);
      }
    });
    void ensureUserDoc(uid, user.email ?? '', user.displayName ?? '').then(() => {
      if (cancelled) return;
      stopPresence = startPresence(uid);
      // Si ya hay permiso, registra el token en silencio (si no, se pide con el banner).
      if (pushSupported() && Notification.permission === 'granted') void registerPush(uid).catch(() => undefined);
    });
    return () => {
      cancelled = true;
      unsub();
      stopPresence?.();
    };
  }, [user, upsert]);

  return <AuthContext.Provider value={{ user, profile, loading }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
