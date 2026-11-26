import { arrayRemove, arrayUnion, doc, setDoc } from 'firebase/firestore';
import { deleteToken, getMessaging, getToken, isSupported } from 'firebase/messaging';
import { app, db } from './firebase';
import { apiPost } from './api';
import { VAPID_KEY } from '../utils/config';

const TOKEN_KEY = 'fcmToken';

export function pushSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

/** Obtiene el token FCM (con el service worker de la PWA) y lo guarda en users/{uid}/private/push. */
export async function registerPush(uid: string): Promise<'granted' | 'denied' | 'default' | 'unsupported'> {
  if (!pushSupported() || !(await isSupported())) return 'unsupported';
  if (Notification.permission === 'default') await Notification.requestPermission();
  if (Notification.permission !== 'granted') return Notification.permission;
  if (!VAPID_KEY) throw new Error('Falta VITE_FIREBASE_VAPID_KEY en el .env');

  const registration = await navigator.serviceWorker.ready;
  const token = await getToken(getMessaging(app), { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    await setDoc(doc(db, 'users', uid, 'private', 'push'), { fcmTokens: arrayUnion(token) }, { merge: true });
  }
  return 'granted';
}

export async function unregisterPush(uid: string): Promise<void> {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return;
  localStorage.removeItem(TOKEN_KEY);
  try {
    await setDoc(doc(db, 'users', uid, 'private', 'push'), { fcmTokens: arrayRemove(token) }, { merge: true });
    if (await isSupported()) await deleteToken(getMessaging(app));
  } catch {
    /* no bloquear el cierre de sesión */
  }
}

/** Pide al servidor que notifique a los demás miembros (el contenido se toma de chat.lastMessage). */
export async function notifyPush(chatId: string): Promise<void> {
  try {
    await apiPost('send-push', { chatId });
  } catch (e) {
    console.warn('No se pudo enviar la notificación push', e);
  }
}
