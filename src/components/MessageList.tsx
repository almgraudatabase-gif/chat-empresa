import { useLayoutEffect, useRef } from 'react';
import type { Chat, Message } from '../types';
import { useUsersStore } from '../context/usersStore';
import { dayKey, formatDayLabel } from '../utils/format';
import { MessageBubble } from './MessageBubble';
import { Spinner } from './Spinner';

interface Props {
  chat: Chat;
  messages: Message[];
  me: string;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  onLoadMore: () => void;
  onReply: (m: Message) => void;
  onDelete: (m: Message, forAll: boolean) => void;
  onOpenImage: (url: string) => void;
}

export function MessageList({
  chat, messages, me, loading, loadingMore, hasMore, error, onLoadMore, onReply, onDelete, onOpenImage,
}: Props) {
  const users = useUsersStore((s) => s.users);
  const ref = useRef<HTMLDivElement>(null);
  const prev = useRef({ first: '', last: '', height: 0, count: 0 });

  const nameOf = (uid: string) => (uid === me ? 'Tú' : users[uid]?.displayName ?? 'Usuario');

  // Mantiene la posición: baja con mensajes nuevos, conserva el scroll al cargar antiguos.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || messages.length === 0) return;
    const first = messages[0].id;
    const lastMsg = messages[messages.length - 1];
    const p = prev.current;
    if (p.count === 0) {
      el.scrollTop = el.scrollHeight;
    } else if (first !== p.first && lastMsg.id === p.last) {
      el.scrollTop += el.scrollHeight - p.height; // se añadieron mensajes antiguos arriba
    } else if (lastMsg.id !== p.last) {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
      if (nearBottom || lastMsg.senderId === me) el.scrollTop = el.scrollHeight;
    }
    prev.current = { first, last: lastMsg.id, height: el.scrollHeight, count: messages.length };
  }, [messages, me]);

  // Reinicia la referencia al cambiar de chat
  useLayoutEffect(() => {
    prev.current = { first: '', last: '', height: 0, count: 0 };
  }, [chat.id]);

  const onScroll = () => {
    const el = ref.current;
    if (el && el.scrollTop < 80 && hasMore && !loadingMore) onLoadMore();
  };

  return (
    <div
      ref={ref}
      onScroll={onScroll}
      className="min-h-0 flex-1 space-y-1 overflow-y-auto bg-chatbg py-3 dark:bg-chatbg-dark"
    >
      {loading && (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      )}
      {error && <p className="px-4 py-2 text-center text-sm text-red-500">{error}</p>}
      {hasMore && !loading && (
        <div className="flex justify-center pb-2">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="rounded-full bg-white px-4 py-1 text-xs text-gray-600 shadow dark:bg-panel-dark dark:text-gray-300"
          >
            {loadingMore ? 'Cargando…' : 'Cargar mensajes anteriores'}
          </button>
        </div>
      )}
      {!loading && messages.length === 0 && (
        <p className="mx-auto mt-6 w-fit rounded-lg bg-white/80 px-4 py-2 text-sm text-gray-600 dark:bg-panel-dark dark:text-gray-300">
          Aún no hay mensajes. ¡Saluda! 👋
        </p>
      )}
      {messages.map((m, i) => {
        const showDay = i === 0 || dayKey(messages[i - 1].createdAt) !== dayKey(m.createdAt);
        const prevSame = i > 0 && messages[i - 1].senderId === m.senderId && !showDay;
        return (
          <div key={m.id}>
            {showDay && (
              <div className="my-2 flex justify-center">
                <span className="rounded-lg bg-white/90 px-3 py-1 text-xs text-gray-600 shadow-sm dark:bg-panel-dark dark:text-gray-300">
                  {formatDayLabel(m.createdAt)}
                </span>
              </div>
            )}
            <div className={prevSame ? 'mt-0.5' : 'mt-2'}>
              <MessageBubble
                message={m}
                chat={chat}
                mine={m.senderId === me}
                senderName={nameOf(m.senderId)}
                replyAuthor={m.replyTo ? nameOf(m.replyTo.senderId) : ''}
                showSender={chat.type === 'group' && !prevSame}
                onReply={onReply}
                onDelete={onDelete}
                onOpenImage={onOpenImage}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
