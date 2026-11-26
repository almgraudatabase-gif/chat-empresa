import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Chat, UserProfile } from '../types';
import { subscribeUser } from '../services/users';
import { useChatMeta } from '../hooks/useChatMeta';
import { useUsersStore } from '../context/usersStore';
import { isOnline, lastSeenText } from '../utils/format';
import { Avatar } from './Avatar';
import { Icon } from './Icon';

interface Props {
  chat: Chat;
  me: string;
  typingUids: string[];
  onOpenInfo: () => void;
}

export function ChatHeader({ chat, me, typingUids, onOpenInfo }: Props) {
  const navigate = useNavigate();
  const meta = useChatMeta(chat, me);
  const users = useUsersStore((s) => s.users);
  const [live, setLive] = useState<UserProfile | null>(null);
  const otherId = chat.type === 'direct' ? chat.members.find((m) => m !== me) : undefined;

  // Presencia en vivo solo del interlocutor del chat abierto (1 listener)
  useEffect(() => {
    if (!otherId) return;
    return subscribeUser(otherId, setLive);
  }, [otherId]);

  const other = live ?? meta.other;
  let subtitle = '';
  if (typingUids.length > 0) {
    subtitle =
      chat.type === 'group'
        ? `${typingUids.map((u) => users[u]?.displayName.split(' ')[0] ?? 'Alguien').join(', ')} escribiendo…`
        : 'escribiendo…';
  } else if (chat.type === 'direct' && other) {
    subtitle = lastSeenText(other.online, other.lastSeen);
  } else if (chat.type === 'group') {
    subtitle = chat.members.map((m) => (m === me ? 'Tú' : users[m]?.displayName.split(' ')[0] ?? '…')).join(', ');
  }
  const typing = typingUids.length > 0;
  const online = chat.type === 'direct' && other ? isOnline(other.online, other.lastSeen) : false;
  const callActive = chat.activeCall?.active && chat.activeCall.startedBy !== me;

  const startCall = (type: 'audio' | 'video') => navigate(`/call/${chat.id}?type=${type}&mode=start`);

  return (
    <div className="shrink-0">
      <header className="flex items-center gap-2 bg-panel px-2 py-2 dark:bg-panel-dark dark:text-gray-100">
        <Link to="/" aria-label="Volver" className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10 md:hidden">
          <Icon name="back" />
        </Link>
        <button
          onClick={chat.type === 'group' ? onOpenInfo : undefined}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <Avatar name={meta.name || '?'} photoURL={meta.photoURL} size={40} group={chat.type === 'group'} online={online} />
          <div className="min-w-0">
            <p className="truncate font-medium">{meta.name}</p>
            <p className={`truncate text-xs ${typing ? 'text-brand' : 'text-gray-500 dark:text-gray-400'}`}>{subtitle}</p>
          </div>
        </button>
        <button onClick={() => startCall('video')} aria-label="Videollamada" className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10">
          <Icon name="video" />
        </button>
        <button onClick={() => startCall('audio')} aria-label="Llamada de voz" className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10">
          <Icon name="phone" />
        </button>
        {chat.type === 'group' && (
          <button onClick={onOpenInfo} aria-label="Info del grupo" className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10">
            <Icon name="more" />
          </button>
        )}
      </header>
      {callActive && chat.activeCall && (
        <button
          onClick={() => navigate(`/call/${chat.id}?type=${chat.activeCall?.callType ?? 'audio'}&mode=join`)}
          className="flex w-full items-center justify-center gap-2 bg-brand py-2 text-sm font-medium text-white"
        >
          <Icon name={chat.activeCall.callType === 'video' ? 'video' : 'phone'} className="h-4 w-4" />
          Llamada en curso · Toca para unirte
        </button>
      )}
    </div>
  );
}
