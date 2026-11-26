import { fileKind } from '../utils/files';

const STYLES = {
  pdf: { bg: 'bg-red-500', label: 'PDF' },
  word: { bg: 'bg-blue-600', label: 'DOC' },
  excel: { bg: 'bg-green-600', label: 'XLS' },
  other: { bg: 'bg-gray-500', label: 'ARCH' },
} as const;

export function FileTypeIcon({ name, size = 40 }: { name: string; size?: number }) {
  const s = STYLES[fileKind(name)];
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-lg font-bold text-white ${s.bg}`}
      style={{ width: size, height: size, fontSize: size / 3.4 }}
    >
      {s.label}
    </div>
  );
}
