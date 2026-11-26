import { useUiStore } from '../context/uiStore';
import { cx } from '../utils/format';

export function Toasts() {
  const toasts = useUiStore((s) => s.toasts);
  const dismiss = useUiStore((s) => s.dismissToast);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-3">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={cx(
            'pointer-events-auto max-w-md rounded-lg px-4 py-2 text-sm text-white shadow-lg',
            t.kind === 'error' ? 'bg-red-600' : 'bg-gray-800',
          )}
        >
          {t.text}
        </button>
      ))}
    </div>
  );
}
