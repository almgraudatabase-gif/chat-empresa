import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { firebaseConfig } from '../utils/config';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Caché local persistente: reduce lecturas facturables y permite ver chats sin conexión.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
