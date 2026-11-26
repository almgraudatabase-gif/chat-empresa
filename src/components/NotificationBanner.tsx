import { useState } from 'react';
import { registerPush, pushSupported } from '../services/push';
import { useUiStore } from '../context/uiStore';
import { Icon } from './Icon';

/** Pide permiso de notificaciones con un gesto del usuario (obligatorio en varios navegadores). */
export function NotificationBanner({ uid }: { uid: string }) {
  const [hidden, setHidden] = useState(() => localStorage.getItem('notifBannerHidden') === '1');
  const [busy, setBusy] = useState(false);
  const toast = useUiStore((s) => s.toast);

  if (!pushSupported() || Notification.permission !== 'default' || hidden) return null;

  const enable = async () => {
    setBusy(true);
    try {
      const res = await registerPush(uid);
      if (res === 'denied') toast('Notificaciones bloqueadas. Actívalas en los ajustes del navegador.');
      else if (res === 'granted') toast('Notificaciones activadas', 'info');
      setHidden(true);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2 bg-amber-100 px-3 py-2 text-sm text-amber-900">
      <Icon name="bell" className="h-5 w-5 shrink-0" />
      <span className="flex-1">Activa las notificaciones para recibir mensajes y llamadas.</span>
      <button onClick={() => void enable()} disabled={busy} className="rounded bg-amber-600 px-3 py-1 font-medium text-white disabled:opacity-60">
        Activar
      </button>
      <button
        onClick={() => {
          localStorage.setItem('notifBannerHidden', '1');
          setHidden(true);
        }}
        aria-label="Ocultar"
      >
        <Icon name="close" className="h-4 w-4" />
      </button>
    </div>
  );
}
