import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Chat } from '../types';
import {
  addGroupMembers,
  removeGroupMember,
  setGroupAdmin,
  updateGroupInfo,
} from '../services/chats';
import { uploadToCloudinary } from '../services/cloudinary';
import { useUsersStore } from '../context/usersStore';
import { useUiStore } from '../context/uiStore';
import { compressImage } from '../utils/image';
import { validateImage } from '../utils/files';
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import { Modal } from './Modal';

interface Props {
  chat: Chat;
  me: string;
  onClose: () => void;
}

export function GroupInfoPanel({ chat, me, onClose }: Props) {
  const navigate = useNavigate();
  const users = useUsersStore((s) => s.users);
  const toast = useUiStore((s) => s.toast);
  const isAdmin = chat.admins.includes(me);
  const [name, setName] = useState(chat.name);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [term, setTerm] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const photoRef = useRef<HTMLInputElement>(null);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch {
      toast('No se pudo completar la acción. Verifica tus permisos y conexión.');
    } finally {
      setBusy(false);
    }
  };

  const candidates = useMemo(() => {
    const t = term.trim().toLowerCase();
    return Object.values(users)
      .filter((u) => !chat.members.includes(u.uid))
      .filter((u) => !t || u.displayName.toLowerCase().includes(t) || u.email.toLowerCase().includes(t));
  }, [users, chat.members, term]);

  const changePhoto = async (file: File | undefined) => {
    if (!file) return;
    const err = validateImage(file);
    if (err) return toast(err);
    await run(async () => {
      const blob = await compressImage(file, { maxSide: 512 });
      const res = await uploadToCloudinary(blob, 'grupo.jpg', 'image', () => undefined);
      await updateGroupInfo(chat.id, { photoURL: res.url });
    });
  };

  const leave = () =>
    run(async () => {
      await removeGroupMember(chat.id, me);
      navigate('/', { replace: true });
    });

  return (
    <Modal title="Info del grupo" onClose={onClose}>
      <div className="space-y-4 p-4">
        <div className="flex flex-col items-center gap-3">
          <Avatar name={chat.name || 'G'} photoURL={chat.photoURL} size={96} group />
          {isAdmin && (
            <>
              <button onClick={() => photoRef.current?.click()} disabled={busy} className="text-sm font-medium text-brand">
                Cambiar foto
              </button>
              <input ref={photoRef} type="file" accept="image/*" hidden onChange={(e) => void changePhoto(e.target.files?.[0])} />
            </>
          )}
        </div>

        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!isAdmin}
            maxLength={60}
            className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-600"
            aria-label="Nombre del grupo"
          />
          {isAdmin && (
            <button
              disabled={busy || !name.trim() || name.trim() === chat.name}
              onClick={() => void run(() => updateGroupInfo(chat.id, { name: name.trim() }))}
              className="rounded-lg bg-brand px-3 text-sm text-white disabled:opacity-50"
            >
              Guardar
            </button>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-500">{chat.members.length} participantes</h3>
            {isAdmin && (
              <button onClick={() => setAdding((v) => !v)} className="flex items-center gap-1 text-sm font-medium text-brand">
                <Icon name="plus" className="h-4 w-4" /> Agregar
              </button>
            )}
          </div>

          {adding && (
            <div className="mb-3 rounded-lg border border-gray-200 p-2 dark:border-gray-700">
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Buscar por nombre o correo"
                className="mb-2 w-full rounded bg-panel px-3 py-2 text-sm outline-none dark:bg-[#202c33]"
              />
              <div className="max-h-40 overflow-y-auto">
                {candidates.length === 0 && <p className="p-2 text-sm text-gray-500">No hay más usuarios para agregar.</p>}
                {candidates.map((u) => (
                  <label key={u.uid} className="flex cursor-pointer items-center gap-3 p-2">
                    <input
                      type="checkbox"
                      checked={selected.includes(u.uid)}
                      onChange={(e) => setSelected((s) => (e.target.checked ? [...s, u.uid] : s.filter((x) => x !== u.uid)))}
                    />
                    <Avatar name={u.displayName} photoURL={u.photoURL} size={32} />
                    <span className="truncate text-sm">{u.displayName}</span>
                  </label>
                ))}
              </div>
              <button
                disabled={busy || selected.length === 0}
                onClick={() =>
                  void run(async () => {
                    await addGroupMembers(chat.id, selected);
                    setSelected([]);
                    setAdding(false);
                  })
                }
                className="mt-2 w-full rounded-lg bg-brand py-2 text-sm text-white disabled:opacity-50"
              >
                Agregar {selected.length > 0 ? `(${selected.length})` : ''}
              </button>
            </div>
          )}

          <ul>
            {chat.members.map((uid) => {
              const u = users[uid];
              const memberIsAdmin = chat.admins.includes(uid);
              return (
                <li key={uid} className="flex items-center gap-3 py-2">
                  <Avatar name={u?.displayName ?? '?'} photoURL={u?.photoURL} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{uid === me ? 'Tú' : u?.displayName ?? 'Usuario'}</p>
                    <p className="truncate text-xs text-gray-500">{u?.email}</p>
                  </div>
                  {memberIsAdmin && (
                    <span className="rounded border border-brand px-1.5 text-xs text-brand">Admin</span>
                  )}
                  {isAdmin && uid !== me && (
                    <div className="flex gap-1 text-xs">
                      <button
                        disabled={busy}
                        onClick={() => void run(() => setGroupAdmin(chat.id, uid, !memberIsAdmin))}
                        className="rounded bg-black/5 px-2 py-1 dark:bg-white/10"
                      >
                        {memberIsAdmin ? 'Quitar admin' : 'Hacer admin'}
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => void run(() => removeGroupMember(chat.id, uid))}
                        className="rounded bg-red-100 px-2 py-1 text-red-700"
                      >
                        Quitar
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <button
          disabled={busy}
          onClick={() => void leave()}
          className="w-full rounded-lg border border-red-300 py-2 text-sm font-medium text-red-600 disabled:opacity-50"
        >
          Salir del grupo
        </button>
      </div>
    </Modal>
  );
}
