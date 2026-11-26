import { cx } from '../utils/format';

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Cargando"
      className={cx('h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent', className)}
    />
  );
}

export function FullScreenLoader() {
  return (
    <div className="flex h-dvh items-center justify-center bg-panel dark:bg-panel-dark">
      <Spinner className="h-10 w-10" />
    </div>
  );
}
