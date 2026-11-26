import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AccessToken } from 'livekit-server-sdk';
import { adminDb, handleError, HttpError, requireMember, requireUser } from './_lib/firebase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  try {
    const uid = await requireUser(req);
    const body = (req.body ?? {}) as { chatId?: unknown };
    await requireMember(body.chatId, uid); // lanza 403 si no es miembro
    const chatId = body.chatId as string;

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    if (!apiKey || !apiSecret) throw new HttpError(500, 'LiveKit no está configurado en el servidor');

    const userSnap = await adminDb().collection('users').doc(uid).get();
    const name = (userSnap.data()?.displayName as string | undefined) ?? 'Usuario';

    const token = new AccessToken(apiKey, apiSecret, { identity: uid, name, ttl: '2h' });
    token.addGrant({ roomJoin: true, room: chatId, canPublish: true, canSubscribe: true });
    return res.status(200).json({ token: await token.toJwt() });
  } catch (err) {
    return handleError(res, err);
  }
}
