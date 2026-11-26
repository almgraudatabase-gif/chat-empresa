import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import { formatDuration } from './VoiceRecorderBar';

/** Reproductor de nota de voz: play/pausa, barra de progreso y tiempo. */
export function AudioPlayer({ url, duration }: { url: string; duration: number }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [total, setTotal] = useState(duration);

  useEffect(() => () => ref.current?.pause(), []);

  const toggle = () => {
    const a = ref.current;
    if (!a) return;
    if (a.paused) {
      // Solo suena un audio a la vez
      document.querySelectorAll('audio').forEach((el) => el !== a && el.pause());
      void a.play().catch(() => setPlaying(false));
    } else a.pause();
  };

  return (
    <div className="flex w-56 items-center gap-2 px-1 py-1 md:w-64">
      <audio
        ref={ref}
        src={url}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setTime(0);
        }}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d) && d > 0) setTotal(d);
        }}
      />
      <button onClick={toggle} aria-label={playing ? 'Pausar' : 'Reproducir'} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white">
        <Icon name={playing ? 'pause' : 'play'} className="h-5 w-5" />
      </button>
      <div className="min-w-0 flex-1">
        <input
          type="range"
          min={0}
          max={total || 1}
          step={0.1}
          value={Math.min(time, total || 1)}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (ref.current) ref.current.currentTime = v;
            setTime(v);
          }}
          aria-label="Progreso del audio"
          className="h-1 w-full cursor-pointer accent-teal-600"
        />
        <p className="text-[11px] text-gray-500">{formatDuration(playing || time > 0 ? time : total)}</p>
      </div>
    </div>
  );
}
