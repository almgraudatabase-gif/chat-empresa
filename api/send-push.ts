import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMessaging } from 'firebase-admin/messaging';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, getAdminApp, handleError, HttpError, requireMember, requireUser } from './_lib/firebase.js';

const MAX_AGE_MS = 60_000;

/**
 * Envía push a los demás miembros del chat. El contenido NO lo dicta el cliente:
 * se toma de chats/{chatId}.lastMessage, que debe ser del solicitante y reciente.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  try {
    const uid = await requireUser(req);
    const body = (req.body ?? {}) as { chatId?: unknown };
    const chat = await requireMember(body.chatId, uid);
    const chatId = body.chatId as string;

    const last = chat.lastMessage;
    if (!last || last.senderId !== uid) throw new HttpError(400, 'No hay un mensaje tuyo reciente para notificar');
    const age = Date.now() - (last.createdAt?.toMillis() ?? 0);
    if (age > MAX_AGE_MS) throw new HttpError(400, 'El mensaje es demasiado antiguo para notificar');

    const db = adminDb();
    const senderSnap = await db.collection('users').doc(uid).get();
    const senderName = (senderSnap.data()?.displayName as string | undefined) ?? 'Alguien';

    const recipients = chat.members.filter((m) => m !== uid);
    const tokenOwners = new Map<string, string>(); // token -> uid
    await Promise.all(
      recipients.map(async (m) => {
        const snap = await db.doc(`users/${m}/private/push`).get();
        const tokens = (snap.data()?.fcmTokens as string[] | undefined) ?? [];
        tokens.forEach((t) => tokenOwners.set(t, m));
      }),
    );
    if (tokenOwners.size === 0) return res.status(200).json({ sent: 0 });

    const isCall = last.type === 'call';
    const callType = last.callType === 'video' ? 'video' : 'audio';
    let preview = (last.text ?? '').slice(0, 140);
    if (last.type === 'image') preview = '📷 Foto';
    else if (last.type === 'file') preview = '📎 Archivo';
    else if (last.type === 'sticker') preview = 'Sticker';
    else if (isCall) preview = callType === 'video' ? '📹 Videollamada entrante' : '📞 Llamada entrante';
    const title = chat.type === 'group' ? `${chat.name ?? 'Grupo'}: ${senderName}` : senderName;

    const tokens = [...tokenOwners.keys()];
    const result = await getMessaging(getAdminApp()).sendEachForMulticast({
      tokens,
      // Solo datos: el service worker construye la notificación.
      data: { title, body: preview, chatId, type: isCall ? 'call' : 'message', callType },
      webpush: { headers: { Urgency: 'high', TTL: isCall ? '30' : '86400' } },
    });

    // Limpia tokens inválidos
    const dead = new Map<string, string[]>();
    result.responses.forEach((r, i) => {
      const code = r.error?.code ?? '';
      if (!r.success && (code.includes('registration-token-not-registered') || code.includes('invalid-argument') || code.includes('invalid-registration-token'))) {
        const owner = tokenOwners.get(tokens[i]);
        if (owner) dead.set(owner, [...(dead.get(owner) ?? []), tokens[i]]);
      }
    });
    await Promise.all(
      [...dead].map(([owner, list]) =>
        db.doc(`users/${owner}/private/push`).update({ fcmTokens: FieldValue.arrayRemove(...list) }),
      ),
    );

    return res.status(200).json({ sent: result.successCount, failed: result.failureCount });
  } catch (err) {
    return handleError(res, err);
  }
}
