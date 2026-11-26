import { memo, useState } from 'react';
import type { Chat, Message } from '../types';
import { cx, formatBytes, formatTime } from '../utils/format';
import { Icon } from './Icon';
import { MessageStatus } from './MessageStatus';
import { FileTypeIcon } from './FileTypeIcon';
import { AudioPlayer } from './AudioPlayer';

interface Props {
  message: Message;
  chat: Chat;
  mine: boolean;
  senderName: string;
  replyAuthor: string;
  showSender: boolean;
  onReply: (m: Message) => void;
  onDelete: (m: Message, forAll: boolean) => void;
  onOpenImage: (url: string) => void;
}

function MessageBubbleBase({ message: m, chat, mine, senderName, replyAuthor, showSender, onReply, onDelete, onOpenImage }: Props) {
  const [menu, setMenu] = useState(false);
  const isSticker = m.type === 'sticker' && !m.deletedForAll;

  return (
    <div className={cx('group flex px-3 md:px-12', mine ? 'justify-end' : 'justify-start')}>
      <div
        className={cx(
          'relative max-w-[85%] md:max-w-[65%] rounded-lg px-2 py-1 shadow-sm',
          isSticker
            ? 'bg-transparent shadow-none'
            : mine
              ? 'bg-bubble-out text-gray-900 dark:bg-bubble-outDark dark:text-gray-100'
              : 'bg-bubble-in text-gray-900 dark:bg-bubble-inDark dark:text-gray-100',
        )}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenu(true);
        }}
      >
        {!m.deletedForAll && (
          <button
            onClick={() => setMenu((v) => !v)}
            aria-label="Opciones del mensaje"
            className="absolute right-1 top-1 z-10 rounded-full bg-inherit p-0.5 text-gray-500 opacity-60 md:opacity-0 md:group-hover:opacity-100"
          >
            <Icon name="chevron" className="h-5 w-5" />
          </button>
        )}

        {menu && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setMenu(false)} />
            <div className="absolute right-1 top-7 z-30 w-52 overflow-hidden rounded-lg bg-white py-1 text-sm text-gray-800 shadow-xl dark:bg-[#233138] dark:text-gray-100">
              <button
                className="flex w-full items-center gap-2 px-4 py-2 hover:bg-black/5 dark:hover:bg-white/10"
                onClick={() => {
                  setMenu(false);
                  onReply(m);
                }}
              >
                <Icon name="reply" className="h-4 w-4" /> Responder
              </button>
              <button
                className="flex w-full items-center gap-2 px-4 py-2 hover:bg-black/5 dark:hover:bg-white/10"
                onClick={() => {
                  setMenu(false);
                  onDelete(m, false);
                }}
              >
                <Icon name="trash" className="h-4 w-4" /> Borrar para mí
              </button>
              {mine && (
                <button
                  className="flex w-full items-center gap-2 px-4 py-2 text-red-600 hover:bg-black/5 dark:hover:bg-white/10"
                  onClick={() => {
                    setMenu(false);
                    onDelete(m, true);
                  }}
                >
                  <Icon name="trash" className="h-4 w-4" /> Borrar para todos
                </button>
              )}
            </div>
          </>
        )}

        {showSender && !mine && <p className="px-1 text-xs font-semibold text-teal-600 dark:text-teal-400">{senderName}</p>}

        {m.replyTo && !m.deletedForAll && (
          <div className="mb-1 rounded border-l-4 border-brand bg-black/5 px-2 py-1 text-xs dark:bg-white/10">
            <p className="font-semibold text-brand">{replyAuthor}</p>
            <p className="line-clamp-2 text-gray-600 dark:text-gray-300">{m.replyTo.text}</p>
          </div>
        )}

        {m.deletedForAll ? (
          <p className="px-1 py-0.5 text-sm italic text-gray-500">🚫 Este mensaje fue eliminado</p>
        ) : m.type === 'image' ? (
          <div className="space-y-1">
            <button onClick={() => onOpenImage(m.mediaUrl)} className="block overflow-hidden rounded-md">
              <img src={m.mediaUrl} alt="Foto enviada" loading="lazy" className="max-h-80 w-full min-w-[160px] object-cover" />
            </button>
            {m.text && <p className="whitespace-pre-wrap break-words px-1 text-sm">{m.text}</p>}
          </div>
        ) : m.type === 'file' ? (
          <a
            href={m.mediaUrl}
            target="_blank"
            rel="noreferrer"
            download={m.fileName}
            className="flex items-center gap-3 rounded-md bg-black/5 p-2 dark:bg-white/10"
          >
            <FileTypeIcon name={m.fileName} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{m.fileName}</p>
              <p className="text-xs text-gray-500">{formatBytes(m.fileSize)} · Toca para abrir</p>
            </div>
          </a>
        ) : m.type === 'audio' ? (
          <AudioPlayer url={m.mediaUrl} duration={m.duration} />
        ) : m.type === 'sticker' ? (
          <img src={m.mediaUrl} alt="Sticker" className="h-32 w-32 object-contain" />
        ) : m.type === 'call' ? (
          <p className="flex items-center gap-2 px-1 py-0.5 text-sm">
            <Icon name={m.callType === 'video' ? 'video' : 'phone'} className="h-4 w-4 text-brand" />
            {m.callType === 'video' ? 'Videollamada' : 'Llamada de voz'}
          </p>
        ) : (
          <p className="whitespace-pre-wrap break-words px-1 pr-12 text-sm leading-relaxed">{m.text}</p>
        )}

        <div
          className={cx(
            'flex items-center justify-end gap-1 px-1 text-[11px] text-gray-500',
            isSticker && 'rounded-full bg-black/30 px-2 text-white',
            (m.type === 'image' || m.type === 'file' || m.type === 'call' || m.type === 'audio') && 'mt-0.5',
          )}
        >
          <span>{formatTime(m.createdAt)}</span>
          {mine && !m.deletedForAll && <MessageStatus message={m} chat={chat} />}
        </div>
      </div>
    </div>
  );
}

export const MessageBubble = memo(MessageBubbleBase);
