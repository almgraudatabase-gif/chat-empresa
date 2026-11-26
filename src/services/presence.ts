import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

const HEARTBEAT_MS = 4 * 60 * 1000;

async function write(uid: string, online: boolean) {
  try {
    await updateDoc(doc(db, 'users', uid), { online, lastSeen: serverTimestamp() });
  } catch {
    /* sin conexión: se reintentará en el siguiente evento */
  }
}

/** Mantiene online/lastSeen: visible = en línea, oculto/cerrado = desconectado, latido cada 4 min. */
export function startPresence(uid: string): () => void {
  let timer: number | undefined;
  const goOnline = () => {
    void write(uid, true);
    window.clearInterval(timer);
    timer = window.setInterval(() => void write(uid, true), HEARTBEAT_MS);
  };
  const goOffline = () => {
    window.clearInterval(timer);
    void write(uid, false);
  };
  const onVisibility = () => (document.visibilityState === 'visible' ? goOnline() : goOffline());

  if (document.visibilityState === 'visible') goOnline();
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', goOffline);
  window.addEventListener('online', goOnline);
  return () => {
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', goOffline);
    window.removeEventListener('online', goOnline);
    window.clearInterval(timer);
  };
}
