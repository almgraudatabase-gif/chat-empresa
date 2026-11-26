# Chat Empresa — resumen del proyecto

Chat interno tipo WhatsApp (PWA) en español. React 19 + TypeScript + Vite + Tailwind. Desplegado en Vercel.
Servicios: Firebase (Auth, Firestore, FCM), Cloudinary (fotos/archivos), LiveKit Cloud (llamadas), Zustand (estado).
El usuario NO es programador: explicar en español sencillo.

## Comandos
- `npm run dev` — app local (sin /api: no funcionan llamadas ni push; usar `npx vercel dev` para eso)
- `npm run build` — `tsc -b` + typecheck de `api/` + `vite build`
- `npm run assets` — regenera iconos y stickers (`scripts/generate-assets.mjs`, usa sharp)

## Carpetas
- `src/pages` — pantallas: AppShell (layout lista+chat), AuthPages (login/registro/reset), ChatRoomPage, CallPage (lazy), UsersPage, NewGroupPage, ProfilePage
- `src/components` — piezas de UI (MessageInput, MessageBubble, AttachmentPreview, IncomingCallModal, NotificationBanner, ProtectedRoute…)
- `src/services` — toda la comunicación externa: firebase, auth, chats, messages, users, presence, push, cloudinary, api (fetch a /api con token)
- `src/hooks` — useMessages, useChatsSubscription, useTyping, useRingtone, useChatMeta
- `src/context` — AuthContext + stores zustand (chats, users, ui/tema/toasts)
- `src/utils` — config (lee env), files, image (compresión), format, chat
- `api/` — funciones serverless de Vercel: `livekit-token.ts`, `send-push.ts`, `_lib/firebase.ts` (firebase-admin, verifica token, comprueba membresía)
- `public/firebase-messaging-sw.js` — manejador de push, importado por el service worker de la PWA (workbox `importScripts` en vite.config.ts)
- `firestore.rules` — seguridad de la base de datos (se pega a mano en la consola de Firebase; no se despliega automáticamente)

## Cómo funciona
- **Login**: Firebase Auth correo+contraseña. `AuthContext` escucha `onAuthStateChanged`; `ProtectedRoute` manda a `/login` si no hay sesión, `PublicOnlyRoute` manda a `/` si ya hay. Al entrar se crea `users/{uid}` si falta, se inicia presencia (en línea/última vez, latido 4 min) y se registra push si ya hay permiso.
- **Chats**: colección `chats` (directo con id `uidA_uidB` ordenado; grupo con id aleatorio). Un solo listener `where members array-contains uid` alimenta la lista. Mensajes en `chats/{id}/messages`; listener en tiempo real de los últimos 30 + paginación (`startAfter`). "Escribiendo…" en `chats/{id}/typing/{uid}`.
- **Enviar mensaje** (`services/messages.ts`): un batch atómico = mensaje + `lastMessage` + `unreadCount` de los demás; luego `notifyPush`. Ticks: `deliveredTo`/`readBy`.
- **Archivos**: el navegador sube directo a Cloudinary (preset *unsigned*, `VITE_CLOUDINARY_*`). Fotos se comprimen a 1280 px JPEG 0.7 (`utils/image.ts`) y van como `image`; documentos (pdf, doc(x), xls(x), csv, ppt(x), txt, zip; límite `VITE_MAX_FILE_MB`, 10 por defecto) van como `raw`. En Firestore solo se guarda la URL (`mediaUrl`).
- **Llamadas**: botón en ChatHeader → `/call/:chatId?type=audio|video&mode=start`. CallPage pide token a `/api/livekit-token` (room = chatId), manda un mensaje `type:"call"` + `chats.activeCall`, y entra a LiveKit. Los demás ven `IncomingCallModal` (ventana de 45 s, timbre WebAudio) o el botón "Llamada en curso · Toca para unirte" en el header; contestar = `mode=join`. Al colgar el último, `activeCall.active=false`.
- **Push**: cliente guarda token FCM en `users/{uid}/private/push`. Tras enviar, el cliente llama `/api/send-push {chatId}`; el servidor lee `chat.lastMessage` (debe ser del solicitante y <60 s), busca tokens de los demás miembros y envía mensaje solo-datos; el service worker muestra la notificación; al tocarla navega a `/chat/:id`. Tokens muertos se limpian.
- **/api**: el cliente manda `Authorization: Bearer <ID token Firebase>`; el servidor lo verifica y comprueba que sea miembro del chat.

## Variables de entorno (solo nombres)
- Frontend (`VITE_*`, públicas): `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_VAPID_KEY`, `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET`, `VITE_LIVEKIT_URL`, `VITE_MAX_FILE_MB` (opcional)
- Solo servidor (Vercel, secretas): `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `FIREBASE_SERVICE_ACCOUNT` (JSON en una línea)
- Plantilla en `.env.example`. `.env` está en .gitignore. Nunca imprimir ni commitear valores.

## Puntos de atención conocidos
- El registro está abierto a cualquiera que tenga la URL (no hay lista de correos permitidos ni verificación) y cualquier usuario registrado puede leer la lista completa de usuarios.
- `activeCall` queda "activa" para siempre si quien llama cierra la pestaña/pierde conexión sin colgar (el botón "Llamada en curso" no caduca).
- No hay timeout ni "rechazada" para el que llama: rechazar solo oculta la pantalla localmente.
- Push depende de que el cliente llame a `/api/send-push` en los 60 s siguientes (si se envió sin conexión, no habrá push).
- Borrar para todos no borra el archivo en Cloudinary; las URLs de Cloudinary son públicas para quien las tenga.
- Las reglas de Firestore hay que publicarlas manualmente en la consola cuando cambien.
- No hay tests automáticos.
