import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  writeBatch,
  type DocumentData,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
  type Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { notifyPush } from './push';
import { PAGE_SIZE } from '../utils/config';
import { messagePreview } from '../utils/format';
import type { CallType, Chat, Message, MessageType, OutgoingMessage, ReplyRef } from '../types';

function toMessage(d: QueryDocumentSnapshot<DocumentData>): Message {
  const x = d.data({ serverTimestamps: 'estimate' });
  return {
    id: d.id,
    senderId: x.senderId as string,
    type: x.type as MessageType,
    text: (x.text as string) ?? '',
    mediaUrl: (x.mediaUrl as string) ?? '',
    fileName: (x.fileName as string) ?? '',
    fileSize: (x.fileSize as number) ?? 0,
    replyTo: (x.replyTo as ReplyRef | null) ?? null,
    createdAt: (x.createdAt as Timestamp | null) ?? null,
    deliveredTo: (x.deliveredTo as string[]) ?? [],
    readBy: (x.readBy as string[]) ?? [],
    deletedFor: (x.deletedFor as string[]) ?? [],
    deletedForAll: Boolean(x.deletedForAll),
    callType: x.callType as CallType | undefined,
    pending: d.metadata.hasPendingWrites,
  };
}

export interface MessagePage {
  messages: Message[];
  cursor: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

const messagesCol = (chatId: string) => collection(db, 'chats', chatId, 'messages');

/** Listener en tiempo real de los últimos 30 mensajes. Devuelve la función para desuscribirse. */
export function subscribeLatestMessages(
  chatId: string,
  cb: (page: MessagePage) => void,
  onError: (e: Error) => void,
): () => void {
  const q = query(messagesCol(chatId), orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snap) =>
      cb({
        messages: snap.docs.map(toMessage),
        cursor: snap.docs[snap.docs.length - 1] ?? null,
        hasMore: snap.size >= PAGE_SIZE,
      }),
    onError,
  );
}

/** Página de mensajes más antiguos (limit + startAfter). */
export async function fetchOlderMessages(
  chatId: string,
  cursor: DocumentSnapshot<DocumentData>,
): Promise<MessagePage> {
  const q = query(messagesCol(chatId), orderBy('createdAt', 'desc'), startAfter(cursor), limit(PAGE_SIZE));
  const snap = await getDocs(q);
  return {
    messages: snap.docs.map(toMessage),
    cursor: snap.docs[snap.docs.length - 1] ?? null,
    hasMore: snap.size >= PAGE_SIZE,
  };
}

/**
 * Envía un mensaje: 1 lote atómico (mensaje + lastMessage + no leídos).
 * `chatExtra` permite añadir campos del chat (p. ej. activeCall al iniciar una llamada).
 */
export async function sendMessage(
  chat: Pick<Chat, 'id' | 'members'>,
  senderId: string,
  msg: OutgoingMessage,
  chatExtra: Record<string, unknown> = {},
): Promise<void> {
  const msgRef = doc(messagesCol(chat.id));
  const text = (msg.text ?? '').trim();
  const batch = writeBatch(db);
  batch.set(msgRef, {
    senderId,
    type: msg.type,
    text,
    mediaUrl: msg.mediaUrl ?? '',
    fileName: msg.fileName ?? '',
    fileSize: msg.fileSize ?? 0,
    replyTo: msg.replyTo ?? null,
    createdAt: serverTimestamp(),
    deliveredTo: [senderId],
    readBy: [senderId],
    deletedFor: [],
    deletedForAll: false,
    ...(msg.callType ? { callType: msg.callType } : {}),
  });

  const chatUpdate: Record<string, unknown> = {
    lastMessage: {
      id: msgRef.id,
      text: msg.type === 'file' ? msg.fileName ?? '' : text.slice(0, 200),
      senderId,
      createdAt: serverTimestamp(),
      type: msg.type,
      ...(msg.callType ? { callType: msg.callType } : {}),
    },
    ...chatExtra,
  };
  chat.members.filter((m) => m !== senderId).forEach((m) => (chatUpdate[`unreadCount.${m}`] = increment(1)));
  batch.update(doc(db, 'chats', chat.id), chatUpdate);

  await batch.commit();
  void notifyPush(chat.id);
}

/** Marca como leídos (y entregados) los mensajes ajenos pendientes y pone el contador en 0. */
export async function markMessagesRead(chatId: string, uid: string, messageIds: string[], resetCounter: boolean) {
  if (messageIds.length === 0 && !resetCounter) return;
  const batch = writeBatch(db);
  messageIds.slice(0, 400).forEach((id) =>
    batch.update(doc(db, 'chats', chatId, 'messages', id), {
      readBy: arrayUnion(uid),
      deliveredTo: arrayUnion(uid),
    }),
  );
  if (resetCounter) batch.update(doc(db, 'chats', chatId), { [`unreadCount.${uid}`]: 0 });
  await batch.commit();
}

/** Marca un mensaje como entregado (sin leerlo) cuando llega a la lista de chats. */
export async function markDelivered(chatId: string, messageId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), { deliveredTo: arrayUnion(uid) }).catch(
    () => undefined,
  );
}

export async function deleteForMe(chatId: string, messageId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), { deletedFor: arrayUnion(uid) });
}

export async function deleteForAll(chatId: string, messageId: string): Promise<void> {
  await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
    deletedForAll: true,
    text: '',
    mediaUrl: '',
    fileName: '',
    fileSize: 0,
  });
}

export function buildReplyRef(m: Message): ReplyRef {
  return {
    messageId: m.id,
    senderId: m.senderId,
    type: m.type,
    text: messagePreview(m.type, m.type === 'file' ? m.fileName : m.text, m.callType).slice(0, 120),
  };
}

// ---------- Escribiendo... ----------
export async function setTyping(chatId: string, uid: string, isTyping: boolean): Promise<void> {
  await setDoc(doc(db, 'chats', chatId, 'typing', uid), { isTyping, updatedAt: serverTimestamp() }, { merge: true });
}

export function subscribeTyping(chatId: string, cb: (typingUids: string[]) => void): () => void {
  return onSnapshot(collection(db, 'chats', chatId, 'typing'), (snap) => {
    cb(snap.docs.filter((d) => d.data().isTyping === true).map((d) => d.id));
  });
}
