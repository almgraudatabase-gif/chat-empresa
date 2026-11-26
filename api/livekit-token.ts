import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  // Las librerías se cargan aquí dentro para que, si alguna falla al arrancar,
  // el error llegue como JSON en vez de un 500 sin explicación.
  let lib: typeof import('./_lib/firebase.js');
  let AccessToken: typeof import('livekit-server-sdk').AccessToken;
  try {
    lib = await import('./_lib/firebase.js');
    AccessToken = (await import('livekit-server-sdk')).AccessToken;
  } catch (err) {
    console.error('Fallo al cargar módulos', err);
    return res.status(500).json({ error: `Fallo al cargar módulos: ${(err as Error).message}` });
  }

  try {
    const uid = await lib.requireUser(req);
    const body = (req.body ?? {}) as { chatId?: unknown };
    await lib.requireMember(body.chatId, uid); // lanza 403 si no es miembro
    const chatId = body.chatId as string;

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    if (!apiKey || !apiSecret) throw new lib.HttpError(500, 'LiveKit no está configurado en el servidor');

    const userSnap = await lib.adminDb().collection('users').doc(uid).get();
    const name = (userSnap.data()?.displayName as string | undefined) ?? 'Usuario';

    const token = new AccessToken(apiKey, apiSecret, { identity: uid, name, ttl: '2h' });
    token.addGrant({ roomJoin: true, room: chatId, canPublish: true, canSubscribe: true });
    return res.status(200).json({ token: await token.toJwt() });
  } catch (err) {
    return lib.handleError(res, err);
  }
}
