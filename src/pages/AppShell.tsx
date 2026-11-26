import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUiStore } from '../context/uiStore';
import { useUsersStore } from '../context/usersStore';
import { useChatsStore } from '../context/chatsStore';
import { useChatsSubscription } from '../hooks/useChatsSubscription';
import { logout } from '../services/auth';
import { unregisterPush } from '../services/push';
import { cx } from '../utils/format';
import { Avatar } from '../components/Avatar';
import { ChatList } from '../components/ChatList';
import { Icon } from '../components/Icon';
import { IncomingCallModal } from '../components/IncomingCallModal';
import { NotificationBanner } from '../components/NotificationBanner';

/** Celular: una columna (lista O conversación). Tablet/PC (md+): dos paneles. */
export default function AppShell() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useUiStore();
  const loadUsers = useUsersStore((s) => s.load);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const atRoot = location.pathname === '/';

  useChatsSubscription(user?.uid);

  useEffect(() => {
    void loadUsers().catch(() => undefined);
  }, [loadUsers]);

  // El service worker pide navegar al tocar una notificación
  useEffect(() => {
    const onMsg = (e: MessageEvent<{ type?: string; path?: string }>) => {
      if (e.data?.type === 'navigate' && e.data.path) navigate(e.data.path);
    };
    navigator.serviceWorker?.addEventListener('message', onMsg);
    return () => navigator.serviceWorker?.removeEventListener('message', onMsg);
  }, [navigate]);

  if (!user) return null;

  const doLogout = async () => {
    await unregisterPush(user.uid);
    useChatsStore.getState().reset();
    useUsersStore.getState().reset();
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-white text-gray-900 dark:bg-panel-dark dark:text-gray-100">
      <aside
        className={cx(
          'relative w-full flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-panel-dark md:flex md:w-[380px] md:max-w-[40%] md:shrink-0',
          atRoot ? 'flex' : 'hidden',
        )}
      >
        <header className="flex items-center gap-2 bg-panel px-3 py-2 dark:bg-[#202c33]">
          <Link to="/profile" aria-label="Mi perfil">
            <Avatar name={profile?.displayName ?? '?'} photoURL={profile?.photoURL} size={40} />
          </Link>
          <h1 className="flex-1 truncate text-lg font-semibold">Chats</h1>
          <button onClick={toggleTheme} aria-label="Cambiar tema" className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10">
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
          <Link to="/new-group" aria-label="Nuevo grupo" className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10">
            <Icon name="users" />
          </Link>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenu((v) => !v)} aria-label="Menú" className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10">
              <Icon name="more" />
            </button>
            {menu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setMenu(false)} />
                <div className="absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded-lg bg-white py-1 text-sm shadow-xl dark:bg-[#233138]">
                  <Link to="/profile" onClick={() => setMenu(false)} className="block px-4 py-2 hover:bg-black/5 dark:hover:bg-white/10">Perfil</Link>
                  <Link to="/new-group" onClick={() => setMenu(false)} className="block px-4 py-2 hover:bg-black/5 dark:hover:bg-white/10">Nuevo grupo</Link>
                  <button onClick={() => void doLogout()} className="block w-full px-4 py-2 text-left text-red-600 hover:bg-black/5 dark:hover:bg-white/10">
                    Cerrar sesión
                  </button>
                </div>
              </>
            )}
          </div>
        </header>
        <NotificationBanner uid={user.uid} />
        <ChatList me={user.uid} />
        <Link
          to="/users"
          aria-label="Nuevo chat"
          className="absolute bottom-5 right-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-lg hover:bg-brand-dark"
        >
          <Icon name="plus" className="h-7 w-7" />
        </Link>
      </aside>

      <main className={cx('min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:flex', atRoot ? 'hidden' : 'flex')}>
        <Outlet />
      </main>

      <IncomingCallModal me={user.uid} />
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-panel p-8 text-center text-gray-500 dark:bg-chatbg-dark dark:text-gray-400">
      <img src="/icons/icon-192.png" alt="" className="h-24 w-24 rounded-3xl opacity-80" />
      <h2 className="text-2xl font-light">Chat Empresa</h2>
      <p className="max-w-sm text-sm">Selecciona un chat de la lista o inicia uno nuevo con el botón verde.</p>
    </div>
  );
}
