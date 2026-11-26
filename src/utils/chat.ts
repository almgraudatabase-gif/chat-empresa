/** Id determinístico para chats directos: uids ordenados y unidos con "_". */
export function directChatId(a: string, b: string): string {
  return [a, b].sort().join('_');
}

export const STICKERS = [
  'feliz', 'risa', 'guino', 'amor', 'genial', 'triste',
  'enojado', 'sorpresa', 'sueno', 'ok', 'estrella', 'corazon',
].map((n) => `/stickers/${n}.webp`);
