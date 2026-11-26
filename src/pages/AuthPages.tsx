import { useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { authErrorMessage, loginWithEmail, registerWithEmail, resetPassword } from '../services/auth';
import { Spinner } from '../components/Spinner';

function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-brand-deeper to-brand-dark p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-panel-dark dark:text-gray-100">
        <div className="mb-5 flex flex-col items-center gap-2">
          <img src="/icons/icon-192.png" alt="" className="h-16 w-16 rounded-2xl" />
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand dark:border-gray-600';
const btnCls =
  'flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2.5 font-medium text-white disabled:opacity-60';

function useSubmit(action: () => Promise<void>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, submit };
}

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { busy, error, submit } = useSubmit(() => loginWithEmail(email.trim(), password));
  return (
    <AuthLayout title="Iniciar sesión">
      <form onSubmit={(e) => void submit(e)} className="space-y-3">
        <input className={inputCls} type="email" required autoComplete="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={inputCls} type="password" required autoComplete="current-password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button className={btnCls} disabled={busy}>{busy && <Spinner className="h-4 w-4 border-white border-t-transparent" />} Entrar</button>
      </form>
      <div className="mt-4 flex flex-col items-center gap-1 text-sm">
        <Link to="/reset" className="text-brand">¿Olvidaste tu contraseña?</Link>
        <Link to="/register" className="text-brand">Crear una cuenta</Link>
      </div>
    </AuthLayout>
  );
}

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const { busy, error, submit } = useSubmit(async () => {
    if (name.trim().length < 2) throw Object.assign(new Error(), { code: 'name' });
    if (password !== confirm) throw Object.assign(new Error(), { code: 'mismatch' });
    await registerWithEmail(name.trim(), email.trim(), password);
  });
  return (
    <AuthLayout title="Crear cuenta">
      <form onSubmit={(e) => void submit(e)} className="space-y-3">
        <input className={inputCls} required minLength={2} placeholder="Nombre visible" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={inputCls} type="email" required autoComplete="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={inputCls} type="password" required minLength={6} autoComplete="new-password" placeholder="Contraseña (mín. 6)" value={password} onChange={(e) => setPassword(e.target.value)} />
        <input className={inputCls} type="password" required autoComplete="new-password" placeholder="Repite la contraseña" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button className={btnCls} disabled={busy}>{busy && <Spinner className="h-4 w-4 border-white border-t-transparent" />} Registrarme</button>
      </form>
      <p className="mt-4 text-center text-sm">
        ¿Ya tienes cuenta? <Link to="/login" className="text-brand">Inicia sesión</Link>
      </p>
    </AuthLayout>
  );
}

export function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const { busy, error, submit } = useSubmit(async () => {
    await resetPassword(email.trim());
    setSent(true);
  });
  return (
    <AuthLayout title="Recuperar contraseña">
      {sent ? (
        <p className="text-center text-sm">Te enviamos un correo con instrucciones. Revisa también la carpeta de spam.</p>
      ) : (
        <form onSubmit={(e) => void submit(e)} className="space-y-3">
          <input className={inputCls} type="email" required placeholder="Correo de tu cuenta" value={email} onChange={(e) => setEmail(e.target.value)} />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button className={btnCls} disabled={busy}>{busy && <Spinner className="h-4 w-4 border-white border-t-transparent" />} Enviar enlace</button>
        </form>
      )}
      <p className="mt-4 text-center text-sm">
        <Link to="/login" className="text-brand">Volver a iniciar sesión</Link>
      </p>
    </AuthLayout>
  );
}
