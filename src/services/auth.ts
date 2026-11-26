import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string }).code ?? '';
  const map: Record<string, string> = {
    name: 'Escribe tu nombre (mínimo 2 letras).',
    mismatch: 'Las contraseñas no coinciden.',
    'auth/invalid-email': 'El correo no es válido.',
    'auth/user-not-found': 'No existe una cuenta con ese correo.',
    'auth/wrong-password': 'Contraseña incorrecta.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
    'auth/network-request-failed': 'Sin conexión. Revisa tus datos móviles o Wi-Fi.',
  };
  return map[code] ?? 'Ocurrió un error. Inténtalo de nuevo.';
}

export async function registerWithEmail(name: string, email: string, password: string): Promise<void> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  await setDoc(doc(db, 'users', cred.user.uid), {
    displayName: name,
    email: email.toLowerCase(),
    photoURL: '',
    online: true,
    lastSeen: serverTimestamp(),
  });
}

export async function loginWithEmail(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function logout(): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (uid) {
    await updateDoc(doc(db, 'users', uid), { online: false, lastSeen: serverTimestamp() }).catch(() => undefined);
  }
  await signOut(auth);
}

/** Crea el documento users/{uid} si no existe (p. ej. cuentas creadas desde la consola). */
export async function ensureUserDoc(uid: string, email: string, displayName: string): Promise<void> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      displayName: displayName || email.split('@')[0],
      email: email.toLowerCase(),
      photoURL: '',
      online: true,
      lastSeen: serverTimestamp(),
    });
  }
}

export async function updateOwnProfile(uid: string, data: { displayName?: string; photoURL?: string }): Promise<void> {
  await updateDoc(doc(db, 'users', uid), data);
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, {
      ...(data.displayName !== undefined ? { displayName: data.displayName } : {}),
      ...(data.photoURL !== undefined ? { photoURL: data.photoURL } : {}),
    });
  }
}
