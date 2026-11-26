import { useEffect, useRef, useState } from 'react';
import { uploadToCloudinary } from '../services/cloudinary';
import { compressImage } from '../utils/image';
import { formatBytes } from '../utils/format';
import { Icon } from './Icon';
import { FileTypeIcon } from './FileTypeIcon';

export interface UploadedAttachment {
  kind: 'image' | 'file' | 'video';
  url: string;
  fileName: string;
  fileSize: number;
  caption: string;
}

interface Props {
  file: File;
  kind: 'image' | 'file' | 'video';
  onCancel: () => void;
  onSend: (a: UploadedAttachment) => Promise<void>;
}

/** Vista previa antes de enviar: comprime fotos, muestra barra de progreso y permite cancelar. */
export function AttachmentPreview({ file, kind, onCancel, onSend }: Props) {
  const [blob, setBlob] = useState<Blob | null>(kind === 'image' ? null : file);
  const [previewUrl, setPreviewUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (kind !== 'video') return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, kind]);

  useEffect(() => {
    if (kind !== 'image') return;
    let url = '';
    let cancelled = false;
    compressImage(file)
      .then((b) => {
        if (cancelled) return;
        url = URL.createObjectURL(b);
        setBlob(b);
        setPreviewUrl(url);
      })
      .catch(() => !cancelled && setError('No se pudo procesar la foto. Prueba con otra.'));
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [file, kind]);

  const send = async () => {
    if (!blob) return;
    setBusy(true);
    setError(null);
    setProgress(0);
    abortRef.current = new AbortController();
    try {
      const fileName = kind === 'image' ? `foto-${Date.now()}.jpg` : file.name || `video-${Date.now()}.mp4`;
      const res = await uploadToCloudinary(blob, fileName, kind === 'image' ? 'image' : kind === 'video' ? 'video' : 'raw', setProgress, abortRef.current.signal);
      await onSend({ kind, url: res.url, fileName, fileSize: res.bytes || blob.size, caption: caption.trim() });
    } catch (e) {
      if ((e as DOMException).name !== 'AbortError') setError((e as Error).message);
      setBusy(false);
    }
  };

  const cancel = () => {
    abortRef.current?.abort();
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-gray-900 text-white">
      <div className="flex items-center gap-3 p-3">
        <button onClick={cancel} aria-label="Cancelar" className="rounded-full p-2 hover:bg-white/10">
          <Icon name="close" />
        </button>
        <span className="font-medium">{kind === 'image' ? 'Vista previa de la foto' : kind === 'video' ? 'Vista previa del video' : 'Enviar archivo'}</span>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center p-4">
        {kind === 'video' ? (
          <video src={previewUrl} controls playsInline className="max-h-full max-w-full rounded-lg" />
        ) : kind === 'image' ? (
          previewUrl ? (
            <img src={previewUrl} alt="Vista previa" className="max-h-full max-w-full rounded-lg object-contain" />
          ) : (
            <p className="text-sm text-gray-300">{error ?? 'Preparando foto…'}</p>
          )
        ) : (
          <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-xl bg-white/10 p-6 text-center">
            <FileTypeIcon name={file.name} size={64} />
            <p className="break-all font-medium">{file.name}</p>
            <p className="text-sm text-gray-300">{formatBytes(file.size)}</p>
          </div>
        )}
      </div>

      <div className="space-y-2 bg-gray-800 p-3">
        {busy && (
          <div className="h-2 overflow-hidden rounded-full bg-white/20" role="progressbar" aria-valuenow={progress}>
            <div className="h-full bg-brand transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
        {error && previewUrl && <p className="text-sm text-red-300">{error}</p>}
        {error && kind !== 'image' && <p className="text-sm text-red-300">{error}</p>}
        <div className="flex items-center gap-2">
          {(kind === 'image' || kind === 'video') && (
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              disabled={busy}
              maxLength={500}
              placeholder="Añade un comentario…"
              className="min-w-0 flex-1 rounded-full bg-gray-700 px-4 py-2 text-sm outline-none placeholder:text-gray-400"
            />
          )}
                    <button
            onClick={() => void send()}
            disabled={busy || !blob}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white disabled:opacity-50"
            aria-label="Enviar"
          >
            {busy ? <span className="text-xs font-semibold">{progress}%</span> : <Icon name="send" />}
          </button>
        </div>
      </div>
    </div>
  );
}
