# Chat Empresa

Chat interno tipo WhatsApp (PWA) para celulares/tablets Android y laptops/PC con Windows.
**Registro solo con correo y contraseña** (sin número de teléfono). Todo funciona con planes gratuitos.

**Stack:** React + TypeScript + Vite (PWA) · Firebase Auth / Firestore / FCM · Cloudinary (fotos y archivos) · LiveKit Cloud (llamadas) · Vercel (hosting + `/api`) · Tailwind CSS.

## Funciones
Registro/login/recuperar contraseña · perfil con foto · lista de usuarios con búsqueda · chats 1 a 1 y grupos (nombre, foto, admins, agregar/quitar miembros, salir) · mensajes en tiempo real con ✓ / ✓✓ / ✓✓ azul · escribiendo… / en línea / última conexión · fotos (cámara o galería, compresión a 1280 px / calidad 0.7, vista previa, progreso, visor) · archivos PDF/Excel/Word (límite configurable) · emojis y 12 stickers WebP · responder · borrar para mí / para todos · push con la app cerrada · llamadas de voz y videollamadas 1 a 1 y grupales (silenciar, cámara, cambiar cámara, colgar, pantalla de llamada entrante) · PWA instalable · modo claro/oscuro.

## Estructura
```
api/                  Funciones serverless de Vercel (livekit-token, send-push, _lib)
public/               Iconos, stickers/*.webp, firebase-messaging-sw.js (manejador push)
scripts/              generate-assets.mjs (regenera iconos y stickers: npm run assets)
src/components|pages|hooks|services|context|types|utils
firestore.rules       Reglas de seguridad (con ejemplos permitidos/denegados al final)
vercel.json  .env.example  package.json
```

---

## Lo que debes hacer tú, paso a paso

### A) Firebase
1. Entra a <https://console.firebase.google.com> → **Agregar proyecto** → nombre `chat-empresa` → (Analytics puede ir desactivado) → Crear.
2. **Authentication** → *Comenzar* → pestaña *Método de acceso* → habilita **Correo electrónico/contraseña** (sin "vínculo de correo").
3. **Firestore Database** → *Crear base de datos* → modo **producción** → elige región cercana (p. ej. `southamerica-east1` o `us-central`).
4. En Firestore → pestaña **Reglas** → pega todo el contenido de [firestore.rules](firestore.rules) → **Publicar**.
5. **Configuración del proyecto** (engrane) → pestaña *General* → *Tus apps* → icono **Web `</>`** → registra la app (sin Hosting) → copia el objeto `firebaseConfig`. Esos valores van a `VITE_FIREBASE_*`.
6. **Configuración del proyecto → Cloud Messaging** → sección *Configuración web (Web Push certificates)* → **Generar par de claves** → copia la **clave pública (VAPID)** → `VITE_FIREBASE_VAPID_KEY`.
   *(Si la API "Firebase Cloud Messaging API (V1)" aparece deshabilitada, habilítala desde ese mismo panel.)*
7. **Configuración del proyecto → Cuentas de servicio** → **Generar nueva clave privada** → se descarga un `.json`. **No lo subas a git.** Su contenido completo (convertido a una sola línea) será `FIREBASE_SERVICE_ACCOUNT` en Vercel (paso D).
   - Para ponerlo en una línea (PowerShell): `(Get-Content .\cuenta.json -Raw | ConvertFrom-Json | ConvertTo-Json -Compress)`
8. **Authentication → Configuración → Dominios autorizados**: después del despliegue (paso E) agrega tu dominio de Vercel (p. ej. `chat-empresa.vercel.app`). `localhost` ya viene incluido.

### B) Cloudinary
1. Crea la cuenta en <https://cloudinary.com> (plan gratuito).
2. En el *Dashboard* copia el **Cloud name** → `VITE_CLOUDINARY_CLOUD_NAME`.
3. **Settings (engrane) → Upload → Upload presets → Add upload preset**:
   - *Signing Mode*: **Unsigned**.
   - *Upload preset name*: p. ej. `chat_empresa` → `VITE_CLOUDINARY_UPLOAD_PRESET`.
   - Pestaña *Upload control / Media analysis*: configura **Max file size** (p. ej. `10485760` = 10 MB) y, opcionalmente, *Allowed formats*: `jpg,jpeg,png,webp,pdf,doc,docx,xls,xlsx,csv,ppt,pptx,txt,zip`.
   - Guarda.
4. **Importante para PDFs/ZIP:** **Settings → Security** → activa **"Allow delivery of PDF and ZIP files"**. Si no, los PDF subidos darán error 401 al abrirse.

### C) LiveKit Cloud
1. Crea la cuenta en <https://cloud.livekit.io> (plan gratuito) → **Create project**.
2. En el proyecto → **Settings → Keys**: crea (o usa) una API key. Copia:
   - **URL** (`wss://tu-proyecto.livekit.cloud`) → `VITE_LIVEKIT_URL`
   - **API Key** → `LIVEKIT_API_KEY` (solo Vercel)
   - **API Secret** → `LIVEKIT_API_SECRET` (solo Vercel)

### D) Variables de entorno
1. **Local:** copia `.env.example` a `.env` y llena las variables `VITE_*` (el archivo `.env` ya está en `.gitignore`).
2. **Vercel** (después de importar el proyecto, paso E) → *Settings → Environment Variables* → agrega, para *Production, Preview y Development*:

   | Variable | Valor |
   |---|---|
   | `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` | del paso A5 |
   | `VITE_FIREBASE_VAPID_KEY` | del paso A6 |
   | `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET` | del paso B |
   | `VITE_LIVEKIT_URL` | del paso C |
   | `VITE_MAX_FILE_MB` | opcional (10 por defecto) |
   | `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | del paso C (**secretos**) |
   | `FIREBASE_SERVICE_ACCOUNT` | JSON de la cuenta de servicio en **una línea** (**secreto**) |

### E) Desplegar en Vercel
1. Sube el proyecto a un repositorio de GitHub (`git init`, `git add .`, `git commit`, `git push`). Verifica que `.env` **no** se suba.
2. En <https://vercel.com> → **Add New → Project** → importa el repositorio. Framework: **Vite** (se detecta solo, lee `vercel.json`). Agrega las variables (paso D2) **antes** de pulsar *Deploy*.
3. **Deploy**. Al terminar, abre la URL `https://...vercel.app` (HTTPS es obligatorio para PWA, cámara, micrófono y push).
4. Vuelve al paso A8 y agrega ese dominio en *Dominios autorizados* de Firebase Auth.
5. Alternativa por CLI: `npm i -g vercel && vercel --prod`.
6. Probar localmente con `/api`: `npx vercel dev` (con solo `npm run dev` funciona la app, pero no llamadas ni push).

### F) Instalar la PWA
**Android (Chrome):** abre la URL → menú ⋮ → **Instalar aplicación** (o *Añadir a pantalla de inicio*) → confirma. Al abrirla, pulsa **Activar** en el banner de notificaciones y acepta el permiso. En el celular también acepta cámara y micrófono cuando se pidan.
**Windows (Edge/Chrome):** abre la URL → icono de instalar en la barra de direcciones (⊕) o menú → **Aplicaciones → Instalar este sitio como aplicación**. Permite notificaciones cuando se pida.
**Splash:** Android genera la pantalla de inicio con el icono y el color de fondo (`#075e54`) del manifest.

### G) Pruebas manuales
- [ ] Registrar 3 cuentas con correos distintos; cerrar sesión y volver a entrar; recuperar contraseña.
- [ ] Cambiar nombre y foto de perfil.
- [ ] Buscar usuarios por nombre y por correo; abrir chat directo (no se duplica al abrir de nuevo).
- [ ] Enviar texto: ver reloj → ✓ → ✓✓ (el otro tiene la app cerrada en la lista) → ✓✓ azul (el otro abre el chat).
- [ ] "escribiendo…", "en línea" y "últ. vez" entre dos dispositivos.
- [ ] Foto desde cámara y desde galería: vista previa, barra de progreso, visor a pantalla completa. Verificar que pesa mucho menos que el original.
- [ ] Subir PDF/Excel/Word; probar un archivo mayor al límite y uno de tipo no permitido (debe rechazarse).
- [ ] Emojis y stickers; responder a un mensaje; borrar para mí y para todos.
- [ ] Crear grupo con foto; agregar/quitar miembros; hacer admin; salir del grupo; comprobar que un no-admin no ve los botones de administración.
- [ ] Más de 30 mensajes: "Cargar mensajes anteriores" y scroll arriba.
- [ ] Push con la app **cerrada** (mensaje y llamada).
- [ ] Llamada de voz y videollamada 1 a 1 y grupal: silenciar, apagar cámara, cambiar cámara (celular), colgar; pantalla de llamada entrante; botón "Llamada en curso · Toca para unirte".
- [ ] Modo oscuro; vista de una columna en celular y dos paneles en tablet/PC.
- [ ] Revisar *Firestore → Uso* para confirmar que las lecturas/escrituras están lejos del límite diario.

### Problemas conocidos
- **Ahorro de batería en Android** (Samsung, Xiaomi, Huawei, etc.) puede cerrar el navegador/PWA y retrasar o bloquear los push. Solución: *Ajustes → Aplicaciones → Chrome (o la PWA) → Batería → **Sin restricciones*** y desactivar "optimización de batería". Mantener "Datos en segundo plano" activo.
- **Notificaciones y llamadas entrantes con la app cerrada:** el push muestra la notificación (con vibración); al tocarla se abre el chat y aparece el banner "Llamada en curso" para unirse. La pantalla completa de llamada entrante con timbre solo aparece con la app abierta (limitación de las PWA: no pueden mostrar UI nativa de llamada).
- **El timbre** puede no sonar hasta que el usuario haya interactuado con la página (política de autoplay de los navegadores).
- **iOS** no es objetivo (el push exige instalar la PWA y iOS 16.4+).
- "Entregado" (✓✓ gris) se marca para el **último** mensaje no leído al llegar a la lista de chats (para ahorrar escrituras); los anteriores pasan a leídos al abrir el chat.
- Cloudinary gratuito tiene cuota mensual de almacenamiento/ancho de banda; las fotos ya se comprimen para ahorrarla.
- El indicador "en línea" usa un latido cada 4 min; si un dispositivo se apaga de golpe, se muestra como desconectado a los ~10 min.
- Cada `get()` en las reglas de Firestore (para validar membresía) cuenta como 1 lectura: enviar un mensaje consume ~1 lectura + 2 escrituras.

---

## Cambios respecto al plan original (y por qué)
- **Tokens FCM en `users/{uid}/private/push`** en vez de `users/{uid}.fcmTokens`: el documento `users` lo lee toda la empresa; así los tokens quedan privados.
- **Service worker sin SDK de Firebase:** el push se envía como mensaje de solo datos y `firebase-messaging-sw.js` (importado por el SW de la PWA con Workbox) lo muestra. Evita tener dos service workers en el mismo scope y no requiere la configuración de Firebase en `public/`.
- **`/api/send-push` no recibe el texto del cliente:** lee `chats/{id}.lastMessage` (debe ser del solicitante y de hace < 60 s). Impide que alguien envíe notificaciones falsas.
- **`chats.activeCall`** (campo extra) acompaña al mensaje `type: "call"` para detectar llamadas entrantes sin leer mensajes.
- **Sin índices compuestos:** la lista de chats se ordena en el cliente. Caché local persistente de Firestore para ahorrar lecturas.
- **Fotos se guardan como JPEG** (compresión en canvas) y archivos como recursos `raw` de Cloudinary.
