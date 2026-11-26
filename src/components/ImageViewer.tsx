import { useEffect } from 'react';
import { Icon } from './Icon';

interface ImageViewerProps {
  url: string;
  onClose: () => void;
}

/** Visor de imagen a pantalla completa (Esc o clic fuera para cerrar). */
export function ImageViewer({ url, onClose }: ImageViewerProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-black/95" onClick={onClose}>
      <div className="flex items-center justify-between p-3 text-white" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Cerrar" className="rounded-full p-2 hover:bg-white/10">
          <Icon name="close" />
        </button>
        <a href={url} target="_blank" rel="noreferrer" download className="rounded-full p-2 hover:bg-white/10" aria-label="Abrir original">
          <Icon name="download" />
        </a>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center p-2">
        <img src={url} alt="Foto" className="max-h-full max-w-full object-contain" onClick={(e) => e.stopPropagation()} />
      </div>
    </div>
  );
}
