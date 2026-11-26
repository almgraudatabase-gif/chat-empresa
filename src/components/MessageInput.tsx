import { useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import type { Chat, Message } from '../types';
import { buildReplyRef, sendMessage } from '../services/messages';
import { useUiStore } from '../context/uiStore';
import { ALLOWED_FILE_EXTENSIONS } from '../utils/config';
import { validateDocument, validateImage, validateVideo } from '../utils/files';
import { useUsersStore } from '../context/usersStore';
import { AttachmentPreview, type UploadedAttachment } from './AttachmentPreview';
import { EmojiStickerPicker } from './EmojiStickerPicker';
import { Icon } from './Icon';
import { VoiceRecorderBar, type RecordedVoice } from './VoiceRecorderBar';
import { uploadToCloudinary } from '../services/cloudinary';

interface Props {
  chat: Chat;
  me: string;
  replyTo: Message | null;
  onCancelReply: () => void;
  onTyping: () => void;
  onStopTyping: () => void;
}

interface Pending {
  file: File;
  kind: 'image' | 'file' | 'video';
}

export function MessageInput({ chat, me, replyTo, onCancelReply, onTyping, onStopTyping }: Props) {
  const [text, setText] = useState('');
  const [picker, setPicker] = useState(false);
  const [attachMenu, setAttachMenu] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const toast = useUiStore((s) => s.toast);
  const users = useUsersStore((s) => s.users);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);

  const fail = (e: unknown) => toast((e as Error).message || 'No se pudo enviar el mensaje.');

  const resize = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  const sendText = async () => {
    const value = text.trim();
    if (!value || sending) return;
    setText('');
    requestAnimationFrame(resize);
    onStopTyping();
    const reply = replyTo ? buildReplyRef(replyTo) : null;
    onCancelReply();
    try {
      await sendMessage(chat, me, { type: 'text', text: value, replyTo: reply });
    } catch (e) {
      setText(value);
      fail(e);
    }
  };

  const sendSticker = async (url: string) => {
    setPicker(false);
    try {
      await sendMessage(chat, me, { type: 'sticker', mediaUrl: url, replyTo: replyTo ? buildReplyRef(replyTo) : null });
      onCancelReply();
    } catch (e) {
      fail(e);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && window.matchMedia('(pointer: fine)').matches) {
      e.preventDefault();
      void sendText();
    }
  };

  const onPick = (wanted: 'image' | 'file' | 'video') => (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    // La galería acepta fotos y videos: se decide por el tipo del archivo
    const kind = wanted === 'image' && file.type.startsWith('video/') ? 'video' : wanted;
    const err = kind === 'image' ? validateImage(file) : kind === 'video' ? validateVideo(file) : validateDocument(file);
    if (err) return toast(err);
    setAttachMenu(false);
    setPending({ file, kind });
  };

  const sendAttachment = async (a: UploadedAttachment) => {
    setSending(true);
    try {
      await sendMessage(chat, me, {
        type: a.kind,
        text: a.kind === 'file' ? '' : a.caption,
        mediaUrl: a.url,
        fileName: a.fileName,
        fileSize: a.fileSize,
        replyTo: replyTo ? buildReplyRef(replyTo) : null,
      });
      onCancelReply();
      setPending(null);
    } finally {
      setSending(false);
    }
  };

  const sendVoice = async (v: RecordedVoice) => {
    setRecording(false);
    setSending(true);
    try {
      const { url, bytes } = await uploadToCloudinary(v.blob, `audio-${Date.now()}.${v.ext}`, 'video', () => undefined);
      await sendMessage(chat, me, {
        type: 'audio',
        mediaUrl: url,
        fileSize: bytes,
        duration: v.duration,
        replyTo: replyTo ? buildReplyRef(replyTo) : null,
      });
      onCancelReply();
    } catch (e) {
      fail(e);
    } finally {
      setSending(false);
    }
  };

  const insertEmoji =(emoji: string) => {
    setText((t) => t + emoji);
    onTyping();
    taRef.current?.focus();
  };

  return (
    <div className="shrink-0">
      {replyTo && (
        <div className="flex items-center gap-2 border-t border-gray-200 bg-panel px-3 py-2 dark:border-gray-700 dark:bg-panel-dark">
          <div className="min-w-0 flex-1 rounded border-l-4 border-brand bg-black/5 px-2 py-1 text-xs dark:bg-white/10">
            <p className="font-semibold text-brand">{replyTo.senderId === me ? 'Tú' : users[replyTo.senderId]?.displayName ?? 'Usuario'}</p>
            <p className="truncate text-gray-600 dark:text-gray-300">{buildReplyRef(replyTo).text}</p>
          </div>
          <button onClick={onCancelReply} aria-label="Cancelar respuesta" className="rounded-full p-1 hover:bg-black/10">
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>
      )}

      {picker && <EmojiStickerPicker onEmoji={insertEmoji} onSticker={(u) => void sendSticker(u)} />}

      {recording && <VoiceRecorderBar onCancel={() => setRecording(false)} onDone={(v) => void sendVoice(v)} onError={toast} />}

      {!recording && (<div className="relative flex items-end gap-1 bg-panel px-2 py-2 dark:bg-panel-dark">
        <button
          onClick={() => {
            setPicker((v) => !v);
            setAttachMenu(false);
          }}
          aria-label="Emojis y stickers"
          className="rounded-full p-2 text-gray-500 hover:bg-black/5 dark:hover:bg-white/10"
        >
          <Icon name="emoji" />
        </button>

        <div className="relative">
          <button
            onClick={() => {
              setAttachMenu((v) => !v);
              setPicker(false);
            }}
            aria-label="Adjuntar"
            className="rounded-full p-2 text-gray-500 hover:bg-black/5 dark:hover:bg-white/10"
          >
            <Icon name="attach" />
          </button>
          {attachMenu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setAttachMenu(false)} />
              <div className="absolute bottom-12 left-0 z-30 w-48 overflow-hidden rounded-xl bg-white py-1 shadow-xl dark:bg-[#233138] dark:text-gray-100">
                <button className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-black/5 dark:hover:bg-white/10" onClick={() => cameraRef.current?.click()}>
                  <Icon name="camera" className="h-5 w-5 text-pink-500" /> Cámara
                </button>
                <button className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-black/5 dark:hover:bg-white/10" onClick={() => videoRef.current?.click()}>
                  <Icon name="video" className="h-5 w-5 text-red-500" /> Grabar video
                </button>
                <button className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-black/5 dark:hover:bg-white/10" onClick={() => galleryRef.current?.click()}>
                  <Icon name="image" className="h-5 w-5 text-purple-500" /> Galería
                </button>
                <button className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-black/5 dark:hover:bg-white/10" onClick={() => docRef.current?.click()}>
                  <Icon name="file" className="h-5 w-5 text-blue-500" /> Documento
                </button>
              </div>
            </>
          )}
        </div>

        <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={onPick('image')} />
        <input ref={galleryRef} type="file" accept="image/*,video/*" hidden onChange={onPick('image')} />
        <input ref={videoRef} type="file" accept="video/*" capture="environment" hidden onChange={onPick('video')} />
        <input
          ref={docRef}
          type="file"
          accept={ALLOWED_FILE_EXTENSIONS.map((e) => `.${e}`).join(',')}
          hidden
          onChange={onPick('file')}
        />

        <textarea
          ref={taRef}
          value={text}
          rows={1}
          placeholder="Escribe un mensaje"
          onChange={(e) => {
            setText(e.target.value);
            resize();
            if (e.target.value) onTyping();
          }}
          onKeyDown={onKeyDown}
          onFocus={() => setPicker(false)}
          onBlur={onStopTyping}
          className="max-h-36 min-h-[40px] flex-1 resize-none rounded-2xl bg-white px-4 py-2 text-sm outline-none dark:bg-[#2a3942] dark:text-gray-100"
        />

        {text.trim() ? (
          <button
            onClick={() => void sendText()}
            aria-label="Enviar"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white"
          >
            <Icon name="send" className="h-5 w-5" />
          </button>
        ) : (
          <button
            onClick={() => {
              setPicker(false);
              setAttachMenu(false);
              setRecording(true);
            }}
            disabled={sending}
            aria-label="Grabar mensaje de voz"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white disabled:opacity-40"
          >
            <Icon name="mic" className="h-5 w-5" />
          </button>
        )}
      </div>)}

      {pending && (
        <AttachmentPreview
          file={pending.file}
          kind={pending.kind}
          onCancel={() => setPending(null)}
          onSend={sendAttachment}
        />
      )}
    </div>
  );
}
