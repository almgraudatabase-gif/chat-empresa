import { collection, doc, getDoc, getDocs, onSnapshot, type DocumentData, type Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { UserProfile } from '../types';

export function toProfile(uid: string, d: DocumentData): UserProfile {
  return {
    uid,
    displayName: (d.displayName as string) ?? 'Usuario',
    email: (d.email as string) ?? '',
    photoURL: (d.photoURL as string) ?? '',
    online: Boolean(d.online),
    lastSeen: (d.lastSeen as Timestamp | null) ?? null,
  };
}

export async function fetchAllUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map((d) => toProfile(d.id, d.data()));
}

export async function fetchUser(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? toProfile(uid, snap.data()) : null;
}

/** Escucha un solo usuario (para mostrar en línea / última conexión en el chat abierto). */
export function subscribeUser(uid: string, cb: (u: UserProfile) => void): () => void {
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    if (snap.exists()) cb(toProfile(uid, snap.data()));
  });
}
