import type { Chat, Message } from '../types';
import { Icon } from './Icon';

/** Estado de un mensaje propio: reloj (enviando), ✓ enviado, ✓✓ entregado, ✓✓ azul leído. */
export function MessageStatus({ message, chat }: { message: Message; chat: Chat }) {
  if (message.pending) return <Icon name="clock" className="h-3.5 w-3.5 text-gray-400" />;
  const others = chat.members.filter((m) => m !== message.senderId);
  const read = others.length > 0 && others.every((m) => message.readBy.includes(m));
  const delivered = others.length > 0 && others.every((m) => message.deliveredTo.includes(m) || message.readBy.includes(m));
  if (read) return <Icon name="checks" className="h-4 w-4 text-sky-500" />;
  if (delivered) return <Icon name="checks" className="h-4 w-4 text-gray-400" />;
  return <Icon name="check" className="h-4 w-4 text-gray-400" />;
}
