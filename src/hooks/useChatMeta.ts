import { useUsersStore } from '../context/usersStore';
import type { Chat, UserProfile } from '../types';

export interface ChatMeta {
  name: string;
  photoURL: string;
  other: UserProfile | null;
}

/** Nombre y foto a mostrar: del otro usuario en directos, del grupo en grupos. */
export function useChatMeta(chat: Chat | undefined, me: string): ChatMeta {
  const users = useUsersStore((s) => s.users);
  if (!chat) return { name: '', photoURL: '', other: null };
  if (chat.type === 'group') return { name: chat.name, photoURL: chat.photoURL, other: null };
  const otherId = chat.members.find((m) => m !== me) ?? me;
  const other = users[otherId] ?? null;
  return { name: other?.displayName ?? 'Cargando…', photoURL: other?.photoURL ?? '', other };
}
