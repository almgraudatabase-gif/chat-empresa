import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUiStore } from '../context/uiStore';
import { useUsersStore } from '../context/usersStore';
import { openDirectChat } from '../services/chats';
import { lastSeenText } from '../utils/format';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/Icon';
import { Spinner } from '../components/Spinner';

export default function UsersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useUiStore((s) => s.toast);
  const { users, loading, load } = useUsersStore();
  const [term, setTerm] = useState('');
  const [opening, setOpening] = useState<string | null>(null);

  const list = useMemo(() => {
    const t = term.trim().toLowerCase();
    return Object.values(users)
      .filter((u) => u.uid !== user?.uid)
      .filter((u) => !t || u.displayName.toLowerCase().includes(t) || u.email.toLowerCase().includes(t))
      .sort((a, b) => a.displayName.localeCompare(b.displayName, 'es'));
  }, [users, term, user?.uid]);

  const open = async (uid: string) => {
    if (!user) return;
    setOpening(uid);
    try {
      navigate(`/chat/${await openDirectChat(user.uid, uid)}`);
    } catch {
      toast('No se pudo abrir el chat. Inténtalo de nuevo.');
      setOpening(null);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-panel-dark dark:text-gray-100">
      <header className="flex items-center gap-2 bg-panel px-2 py-3 dark:bg-[#202c33]">
        <Link to="/" aria-label="Volver" className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10">
          <Icon name="back" />
        </Link>
        <h2 className="flex-1 text-lg font-medium">Nuevo chat</h2>
        <button onClick={() => void load(true)} className="px-3 text-sm text-brand">Actualizar</button>
      </header>
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 rounded-lg bg-panel px-3 py-2 dark:bg-[#202c33]">
          <Icon name="search" className="h-5 w-5 text-gray-500" />
          <input
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar por nombre o correo"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>
      <Link to="/new-group" className="flex items-center gap-3 px-3 py-3 hover:bg-gray-100 dark:hover:bg-white/5">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white"><Icon name="users" /></span>
        <span className="font-medium">Nuevo grupo</span>
      </Link>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && <div className="flex justify-center py-8"><Spinner /></div>}
        {!loading && list.length === 0 && <p className="p-6 text-center text-sm text-gray-500">No se encontraron usuarios.</p>}
        {list.map((u) => (
          <button
            key={u.uid}
            disabled={opening !== null}
            onClick={() => void open(u.uid)}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-100 disabled:opacity-60 dark:hover:bg-white/5"
          >
            <Avatar name={u.displayName} photoURL={u.photoURL} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{u.displayName}</p>
              <p className="truncate text-xs text-gray-500">{u.email} · {lastSeenText(u.online, u.lastSeen)}</p>
            </div>
            {opening === u.uid && <Spinner className="h-5 w-5" />}
          </button>
        ))}
      </div>
    </div>
  );
}
