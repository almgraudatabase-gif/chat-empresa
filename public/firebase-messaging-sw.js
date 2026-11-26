/* Manejador de notificaciones push (FCM, mensajes solo-datos).
   Se importa desde el service worker de la PWA (workbox importScripts),
   por lo que no necesita el SDK ni la configuración de Firebase. */
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = {};
  }
  const d = payload.data || payload;
  if (!d || !d.title) return;
  const isCall = d.type === 'call';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      // Si la app está visible y enfocada, no mostrar notificación duplicada (salvo llamadas).
      const focused = wins.some((w) => w.visibilityState === 'visible' && w.focused);
      if (focused && !isCall) return undefined;
      return self.registration.showNotification(d.title, {
        body: d.body || '',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: d.chatId ? 'chat-' + d.chatId : undefined,
        renotify: true,
        requireInteraction: isCall,
        vibrate: isCall ? [400, 200, 400, 200, 400] : [120],
        data: { chatId: d.chatId, type: d.type, callType: d.callType },
      });
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const path = data.chatId ? '/chat/' + data.chatId : '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if ('focus' in w) {
          w.postMessage({ type: 'navigate', path });
          return w.focus();
        }
      }
      return self.clients.openWindow(path);
    })
  );
});
