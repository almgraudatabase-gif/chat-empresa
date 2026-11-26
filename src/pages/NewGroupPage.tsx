import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUiStore } from '../context/uiStore';
import { useUsersStore } from '../context/usersStore';
import { createGroup } from '../services/chats';
import { uploadToCloudinary } from '../services/cloudinary';
import { validateImage } from '../utils/files';
import { compressImage } from '../utils/image';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/Icon';
import { Spinner } from '../components/Spinner';

export default function NewGroupPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useUiStore((s) => s.toast);
  const users = useUsersStore((s) => s.users);
  const [name, setName] = useState('');
  const [term, setTerm] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const list = useMemo(() => {
    const t = term.trim().toLowerCase();
    return Object.values(users)
      .filter((u) => u.uid !== user?.uid)
      .filter((u) => !t || u.displayName.toLowerCase().includes(t) || u.email.toLowerCase().includes(t))
      .sort((a, b) => a.displayName.localeCompare(b.displayName, 'es'));
  }, [users, term, user?.uid]);

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    const err = validateImage(file);
    if (err) return toast(err);
    try {
      const blob = await compressImage(file, { maxSide: 512 });
      setPhoto(blob);
      setPhotoPreview(URL.createObjectURL(blob));
    } catch {
      toast('No se pudo procesar la foto.');
    }
  };

  const create = async () => {
    if (!user || !name.trim() || selected.length === 0) return;
    setBusy(true);
    try {
      let photoURL = '';
      if (photo) photoURL = (await uploadToCloudinary(photo, 'grupo.jpg', 'image', () => undefined)).url;
      const id = await createGroup(user.uid, name, selected, photoURL);
      navigate(`/chat/${id}`, { replace: true });
    } catch (e) {
      toast((e as Error).message || 'No se pudo crear el grupo.');
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-panel-dark dark:text-gray-100">
      <header className="flex items-center gap-2 bg-panel px-2 py-3 dark:bg-[#202c33]">
        <Link to="/" aria-label="Volver" className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10">
          <Icon name="back" />
        </Link>
        <h2 className="text-lg font-medium">Nuevo grupo</h2>
      </header>

      <div className="flex items-center gap-3 p-3">
        <button onClick={() => fileRef.current?.click()} aria-label="Foto del grupo">
          <Avatar name={name || 'G'} photoURL={photoPreview} size={64} group />
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => void pickPhoto(e.target.files?.[0])} />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder="Nombre del grupo"
          className="min-w-0 flex-1 border-b-2 border-brand bg-transparent py-2 outline-none"
        />
      </div>

      <div className="px-3 pb-2">
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Buscar participantes"
          className="w-full rounded-lg bg-panel px-3 py-2 text-sm outline-none dark:bg-[#202c33]"
        />
      </div>
      {selected.length > 0 && <p className="px-3 pb-1 text-xs text-gray-500">{selected.length} seleccionados</p>}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {list.map((u) => (
          <label key={u.uid} className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-white/5">
            <input
              type="checkbox"
              checked={selected.includes(u.uid)}
              onChange={(e) => setSelected((s) => (e.target.checked ? [...s, u.uid] : s.filter((x) => x !== u.uid)))}
              className="h-4 w-4 accent-[#00a884]"
            />
            <Avatar name={u.displayName} photoURL={u.photoURL} size={40} />
            <div className="min-w-0">
              <p className="truncate font-medium">{u.displayName}</p>
              <p className="truncate text-xs text-gray-500">{u.email}</p>
            </div>
          </label>
        ))}
      </div>

      <div className="p-3">
        <button
          onClick={() => void create()}
          disabled={busy || !name.trim() || selected.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-3 font-medium text-white disabled:opacity-50"
        >
          {busy && <Spinner className="h-4 w-4 border-white border-t-transparent" />} Crear grupo
        </button>
      </div>
    </div>
  );
}
