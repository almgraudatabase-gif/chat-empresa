import { memo } from 'react';
import { NavLink } from 'react-router-dom';
import type { Chat } from '../types';
import { useChatMeta } from '../hooks/useChatMeta';
import { useUsersStore } from '../context/usersStore';
import { cx, formatListTime, isOnline, messagePreview } from '../utils/format';
import { Avatar } from './Avatar';

function ChatListItemBase({ chat, me }: { chat: Chat; me: string }) {
  const meta = useChatMeta(chat, me);
  const users = useUsersStore((s) => s.users);
  const last = chat.lastMessage;
  const unread = chat.unreadCount[me] ?? 0;
  const online = meta.other ? isOnline(meta.other.online, meta.other.lastSeen) : false;

  let preview = 'Sin mensajes todavía';
  if (last) {
    const base = messagePreview(last.type, last.text, last.callType);
    const who = last.senderId === me ? 'Tú: ' : chat.type === 'group' ? `${users[last.senderId]?.displayName.split(' ')[0] ?? ''}: ` : '';
    preview = who + base;
  }

  return (
    <NavLink
      to={`/chat/${chat.id}`}
      className={({ isActive }) =>
        cx(
          'flex items-center gap-3 border-b border-gray-100 px-3 py-3 dark:border-gray-800',
          isActive ? 'bg-gray-200/70 dark:bg-white/10' : 'hover:bg-gray-100 dark:hover:bg-white/5',
        )
      }
    >
      <Avatar name={meta.name || '?'} photoURL={meta.photoURL} group={chat.type === 'group'} online={online} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate font-medium text-gray-900 dark:text-gray-100">{meta.name}</p>
          <span className={cx('shrink-0 text-xs', unread > 0 ? 'font-semibold text-brand' : 'text-gray-500')}>
            {formatListTime(last?.createdAt)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm text-gray-500 dark:text-gray-400">{preview}</p>
          {unread > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-semibold text-white">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
      </div>
    </NavLink>
  );
}

export const ChatListItem = memo(ChatListItemBase);
