import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export function getAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('Falta la variable FIREBASE_SERVICE_ACCOUNT');
  const json = JSON.parse(raw) as { project_id: string; client_email: string; private_key: string };
  return initializeApp({
    credential: cert({
      projectId: json.project_id,
      clientEmail: json.client_email,
      privateKey: json.private_key.replace(/\\n/g, '\n'),
    }),
  });
}

export function adminDb() {
  return getFirestore(getAdminApp());
}

export interface ChatDoc {
  type: 'direct' | 'group';
  members: string[];
  name?: string;
  lastMessage?: {
    id?: string;
    text?: string;
    senderId?: string;
    type?: string;
    createdAt?: { toMillis(): number };
    callType?: string;
  };
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Verifica el ID token de Firebase del encabezado Authorization: Bearer <token>. */
export async function requireUser(req: VercelRequest): Promise<string> {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) throw new HttpError(401, 'No autenticado');
  try {
    const decoded = await getAuth(getAdminApp()).verifyIdToken(token);
    return decoded.uid;
  } catch {
    throw new HttpError(401, 'Token inválido');
  }
}

/** Carga el chat y comprueba que el usuario sea miembro. */
export async function requireMember(chatId: unknown, uid: string): Promise<ChatDoc> {
  if (typeof chatId !== 'string' || !/^[A-Za-z0-9_-]{3,200}$/.test(chatId)) {
    throw new HttpError(400, 'chatId inválido');
  }
  const snap = await adminDb().collection('chats').doc(chatId).get();
  if (!snap.exists) throw new HttpError(404, 'Chat no encontrado');
  const chat = snap.data() as ChatDoc;
  if (!chat.members.includes(uid)) throw new HttpError(403, 'No eres miembro de este chat');
  return chat;
}

export function handleError(res: VercelResponse, err: unknown) {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor' });
}
