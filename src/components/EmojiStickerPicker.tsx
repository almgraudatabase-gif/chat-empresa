import { lazy, Suspense, useState } from 'react';
import { STICKERS } from '../utils/chat';
import { useUiStore } from '../context/uiStore';
import { cx } from '../utils/format';
import { Spinner } from './Spinner';

const EmojiPickerLazy = lazy(() => import('./EmojiPickerLazy'));

interface Props {
  onEmoji: (emoji: string) => void;
  onSticker: (url: string) => void;
}

export function EmojiStickerPicker({ onEmoji, onSticker }: Props) {
  const [tab, setTab] = useState<'emoji' | 'sticker'>('emoji');
  const dark = useUiStore((s) => s.theme === 'dark');

  return (
    <div className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-panel-dark">
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {(['emoji', 'sticker'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cx(
              'flex-1 py-2 text-sm font-medium',
              tab === t ? 'border-b-2 border-brand text-brand' : 'text-gray-500',
            )}
          >
            {t === 'emoji' ? 'Emojis' : 'Stickers'}
          </button>
        ))}
      </div>
      {tab === 'emoji' ? (
        <Suspense fallback={<div className="flex h-[340px] items-center justify-center"><Spinner /></div>}>
          <EmojiPickerLazy dark={dark} onPick={onEmoji} />
        </Suspense>
      ) : (
        <div className="grid h-[340px] grid-cols-4 gap-2 overflow-y-auto p-3 sm:grid-cols-6">
          {STICKERS.map((url) => (
            <button key={url} onClick={() => onSticker(url)} className="rounded-lg p-1 hover:bg-black/5 dark:hover:bg-white/10">
              <img src={url} alt="Sticker" loading="lazy" className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
