import { useMemo, useState } from 'react';
import { useChatsStore } from '../context/chatsStore';
import { useUsersStore } from '../context/usersStore';
import { Icon } from './Icon';
import { ChatListItem } from './ChatListItem';
import { Spinner } from './Spinner';

export function ChatList({ me }: { me: string }) {
  const { chats, loading, error } = useChatsStore();
  const users = useUsersStore((s) => s.users);
  const [term, setTerm] = useState('');

  const sorted = useMemo(() => {
    const t = term.trim().toLowerCase();
    return chats
      .filter((c) => {
        if (!t) return true;
        const name =
          c.type === 'group' ? c.name : users[c.members.find((m) => m !== me) ?? '']?.displayName ?? '';
        return name.toLowerCase().includes(t);
      })
      .sort((a, b) => {
        // Orden en el cliente (evita un índice compuesto en Firestore)
        const ta = a.lastMessage?.createdAt?.toMillis() ?? a.createdAt?.toMillis() ?? 0;
        const tb = b.lastMessage?.createdAt?.toMillis() ?? b.createdAt?.toMillis() ?? 0;
        return tb - ta;
      });
  }, [chats, term, users, me]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 rounded-lg bg-panel px-3 py-1.5 dark:bg-[#202c33]">
          <Icon name="search" className="h-5 w-5 text-gray-500" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar un chat"
            className="w-full bg-transparent text-sm outline-none dark:text-gray-100"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        )}
        {error && <p className="p-4 text-center text-sm text-red-500">{error}</p>}
        {!loading && !error && sorted.length === 0 && (
          <p className="p-6 text-center text-sm text-gray-500">
            {term ? 'Sin resultados.' : 'No tienes chats todavía. Toca el botón verde para empezar uno.'}
          </p>
        )}
        {sorted.map((c) => (
          <ChatListItem key={c.id} chat={c} me={me} />
        ))}
      </div>
    </div>
  );
}
