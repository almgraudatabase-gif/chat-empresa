import { useEffect } from 'react';
import { subscribeChats } from '../services/chats';
import { markDelivered } from '../services/messages';
import { useChatsStore } from '../context/chatsStore';
import { useUsersStore } from '../context/usersStore';

const deliveredSeen = new Set<string>();

/** Escucha todos los chats del usuario y marca "entregado" el último mensaje no leído. */
export function useChatsSubscription(uid: string | undefined) {
  const setChats = useChatsStore((s) => s.setChats);
  const setError = useChatsStore((s) => s.setError);
  const reset = useChatsStore((s) => s.reset);
  const ensure = useUsersStore((s) => s.ensure);

  useEffect(() => {
    if (!uid) return;
    reset();
    const unsub = subscribeChats(
      uid,
      (chats) => {
        setChats(chats);
        chats.forEach((c) => {
          c.members.forEach(ensure);
          const last = c.lastMessage;
          if (last && last.senderId !== uid && (c.unreadCount[uid] ?? 0) > 0 && !deliveredSeen.has(last.id)) {
            deliveredSeen.add(last.id);
            void markDelivered(c.id, last.id, uid);
          }
        });
      },
      () => setError('No se pudieron cargar los chats. Revisa tu conexión.'),
    );
    return unsub; // desuscribe al cerrar sesión / desmontar
  }, [uid, setChats, setError, reset, ensure]);
}
