import type { Timestamp } from 'firebase/firestore';
import type { Message, MessageType } from '../types';

export const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

export function tsToDate(ts: Timestamp | null | undefined): Date | null {
  return ts ? ts.toDate() : null;
}

export function formatTime(ts: Timestamp | null | undefined): string {
  const d = tsToDate(ts) ?? new Date();
  return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function formatDayLabel(ts: Timestamp | null | undefined): string {
  const d = tsToDate(ts) ?? new Date();
  const now = new Date();
  if (sameDay(d, now)) return 'Hoy';
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (sameDay(d, y)) return 'Ayer';
  return d.toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function dayKey(ts: Timestamp | null | undefined): string {
  const d = tsToDate(ts) ?? new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Hora si es hoy, "Ayer" o fecha corta (para la lista de chats). */
export function formatListTime(ts: Timestamp | null | undefined): string {
  if (!ts) return '';
  const d = ts.toDate();
  const now = new Date();
  if (sameDay(d, now)) return formatTime(ts);
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (sameDay(d, y)) return 'Ayer';
  return d.toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

const ONLINE_STALE_MS = 10 * 60 * 1000;

export function isOnline(online: boolean, lastSeen: Timestamp | null | undefined): boolean {
  if (!online) return false;
  if (!lastSeen) return true;
  return Date.now() - lastSeen.toMillis() < ONLINE_STALE_MS;
}

export function lastSeenText(online: boolean, lastSeen: Timestamp | null | undefined): string {
  if (isOnline(online, lastSeen)) return 'en línea';
  if (!lastSeen) return 'desconectado';
  const d = lastSeen.toDate();
  const now = new Date();
  const time = formatTime(lastSeen);
  if (sameDay(d, now)) return `últ. vez hoy a las ${time}`;
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (sameDay(d, y)) return `últ. vez ayer a las ${time}`;
  return `últ. vez el ${d.toLocaleDateString('es', { day: 'numeric', month: 'short' })} a las ${time}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function messagePreview(type: MessageType, text: string, callType?: string): string {
  switch (type) {
    case 'image':
      return text ? `📷 ${text}` : '📷 Foto';
    case 'file':
      return `📎 ${text || 'Archivo'}`;
    case 'sticker':
      return 'Sticker';
    case 'call':
      return callType === 'video' ? '📹 Videollamada' : '📞 Llamada de voz';
    default:
      return text;
  }
}

export function replyPreviewText(m: Pick<Message, 'type' | 'text' | 'fileName' | 'callType'>): string {
  if (m.type === 'file') return m.fileName || 'Archivo';
  return messagePreview(m.type, m.text, m.callType);
}

export function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}
