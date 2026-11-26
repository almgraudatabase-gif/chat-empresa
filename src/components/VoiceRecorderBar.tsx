import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';

export interface RecordedVoice {
  blob: Blob;
  duration: number; // segundos
  ext: string;
}

interface Props {
  onCancel: () => void;
  onDone: (voice: RecordedVoice) => void;
  onError: (message: string) => void;
}

const MAX_SECONDS = 5 * 60;

function pickMime(): { mime: string; ext: string } {
  const options: Array<[string, string]> = [
    ['audio/webm;codecs=opus', 'webm'],
    ['audio/webm', 'webm'],
    ['audio/mp4', 'm4a'], // Safari / iPhone
    ['audio/ogg;codecs=opus', 'ogg'],
  ];
  for (const [mime, ext] of options) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) return { mime, ext };
  }
  return { mime: '', ext: 'webm' };
}

export const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** Barra de grabación: empieza a grabar al aparecer. Basura = cancelar, flecha = enviar. */
export function VoiceRecorderBar({ onCancel, onDone, onError }: Props) {
  const [seconds, setSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startRef = useRef(0);
  const sendRef = useRef(false);
  const cbRef = useRef({ onCancel, onDone, onError });
  cbRef.current = { onCancel, onDone, onError };

  const stopStream = () => streamRef.current?.getTracks().forEach((t) => t.stop());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
          throw new Error('Tu navegador no permite grabar audio.');
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const { mime, ext } = pickMime();
        const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
        recorderRef.current = rec;
        rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
        rec.onstop = () => {
          stopStream();
          if (!sendRef.current) return;
          const duration = Math.max(1, Math.round((Date.now() - startRef.current) / 1000));
          const blob = new Blob(chunksRef.current, { type: rec.mimeType || mime || 'audio/webm' });
          cbRef.current.onDone({ blob, duration, ext });
        };
        startRef.current = Date.now();
        rec.start();
      } catch (e) {
        const denied = (e as DOMException).name === 'NotAllowedError';
        cbRef.current.onError(
          denied ? 'Permite el micrófono en el navegador para grabar audios.' : (e as Error).message || 'No se pudo grabar.',
        );
        cbRef.current.onCancel();
      }
    })();
    return () => {
      cancelled = true;
      sendRef.current = false;
      if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
      stopStream();
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setSeconds(Math.round((Date.now() - startRef.current) / 1000)), 250);
    return () => clearInterval(id);
  }, []);

  const finish = () => {
    const rec = recorderRef.current;
    if (!rec || rec.state === 'inactive') return;
    sendRef.current = true;
    rec.stop();
  };

  useEffect(() => {
    if (seconds >= MAX_SECONDS) finish();
  }, [seconds]);

  return (
    <div className="flex items-center gap-3 bg-panel px-3 py-2 dark:bg-panel-dark">
      <button onClick={onCancel} aria-label="Cancelar grabación" className="rounded-full p-2 text-red-500 hover:bg-black/5 dark:hover:bg-white/10">
        <Icon name="trash" />
      </button>
      <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
      <span className="flex-1 text-sm tabular-nums text-gray-700 dark:text-gray-200">{formatDuration(seconds)}</span>
      <button onClick={finish} aria-label="Enviar audio" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white">
        <Icon name="send" className="h-5 w-5" />
      </button>
    </div>
  );
}
