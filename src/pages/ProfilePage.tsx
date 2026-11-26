import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUiStore } from '../context/uiStore';
import { updateOwnProfile } from '../services/auth';
import { uploadToCloudinary } from '../services/cloudinary';
import { validateImage } from '../utils/files';
import { compressImage } from '../utils/image';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/Icon';
import { Spinner } from '../components/Spinner';

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const toast = useUiStore((s) => s.toast);
  const [name, setName] = useState(profile?.displayName ?? '');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user || !profile) return null;

  const saveName = async () => {
    if (name.trim().length < 2) return toast('El nombre debe tener al menos 2 caracteres.');
    setBusy(true);
    try {
      await updateOwnProfile(user.uid, { displayName: name.trim() });
      toast('Nombre actualizado', 'info');
    } catch {
      toast('No se pudo guardar el nombre.');
    } finally {
      setBusy(false);
    }
  };

  const changePhoto = async (file: File | undefined) => {
    if (!file) return;
    const err = validateImage(file);
    if (err) return toast(err);
    setBusy(true);
    try {
      const blob = await compressImage(file, { maxSide: 512 });
      const res = await uploadToCloudinary(blob, 'perfil.jpg', 'image', () => undefined);
      await updateOwnProfile(user.uid, { photoURL: res.url });
      toast('Foto actualizada', 'info');
    } catch (e) {
      toast((e as Error).message || 'No se pudo cambiar la foto.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-panel-dark dark:text-gray-100">
      <header className="flex items-center gap-2 bg-panel px-2 py-3 dark:bg-[#202c33]">
        <Link to="/" aria-label="Volver" className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10">
          <Icon name="back" />
        </Link>
        <h2 className="text-lg font-medium">Perfil</h2>
      </header>
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-5 p-6">
        <button onClick={() => fileRef.current?.click()} disabled={busy} className="relative" aria-label="Cambiar foto">
          <Avatar name={profile.displayName} photoURL={profile.photoURL} size={128} />
          <span className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white shadow">
            {busy ? <Spinner className="h-5 w-5 border-white border-t-transparent" /> : <Icon name="camera" className="h-5 w-5" />}
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => void changePhoto(e.target.files?.[0])} />

        <div className="w-full space-y-1">
          <label className="text-xs text-brand" htmlFor="pname">Nombre visible</label>
          <div className="flex gap-2">
            <input
              id="pname"
              value={name}
              maxLength={50}
              onChange={(e) => setName(e.target.value)}
              className="min-w-0 flex-1 border-b-2 border-gray-300 bg-transparent py-2 outline-none focus:border-brand"
            />
            <button
              onClick={() => void saveName()}
              disabled={busy || name.trim() === profile.displayName}
              className="rounded-lg bg-brand px-4 text-sm text-white disabled:opacity-50"
            >
              Guardar
            </button>
          </div>
        </div>
        <div className="w-full space-y-1">
          <p className="text-xs text-brand">Correo</p>
          <p className="py-2 text-gray-700 dark:text-gray-300">{profile.email}</p>
        </div>
      </div>
    </div>
  );
}
