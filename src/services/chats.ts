import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { directChatId } from '../utils/chat';
import type { ActiveCall, CallType, Chat, LastMessage } from '../types';

function toChat(id: string, d: DocumentData): Chat {
  return {
    id,
    type: d.type as 'direct' | 'group',
    members: (d.members as string[]) ?? [],
    name: (d.name as string) ?? '',
    photoURL: (d.photoURL as string) ?? '',
    admins: (d.admins as string[]) ?? [],
    createdBy: (d.createdBy as string) ?? '',
    createdAt: (d.createdAt as Timestamp | null) ?? null,
    lastMessage: (d.lastMessage as LastMessage | undefined) ?? null,
    unreadCount: (d.unreadCount as Record<string, number> | undefined) ?? {},
    activeCall: (d.activeCall as ActiveCall | undefined) ?? null,
  };
}

/** Un único listener para todos los chats del usuario (sin leer mensajes). */
export function subscribeChats(uid: string, cb: (chats: Chat[]) => void, onError: (e: Error) => void): () => void {
  const q = query(collection(db, 'chats'), where('members', 'array-contains', uid));
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => toChat(d.id, d.data({ serverTimestamps: 'estimate' })))),
    onError,
  );
}

/** Abre (o crea) el chat directo con otro usuario. Devuelve el chatId. */
export async function openDirectChat(me: string, other: string): Promise<string> {
  const id = directChatId(me, other);
  const ref = doc(db, 'chats', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      type: 'direct',
      members: [me, other],
      name: '',
      photoURL: '',
      admins: [],
      createdBy: me,
      createdAt: serverTimestamp(),
      lastMessage: null,
      unreadCount: { [me]: 0, [other]: 0 },
    });
  }
  return id;
}

export async function createGroup(me: string, name: string, memberIds: string[], photoURL: string): Promise<string> {
  const members = Array.from(new Set([me, ...memberIds]));
  const ref = doc(collection(db, 'chats'));
  await setDoc(ref, {
    type: 'group',
    members,
    name: name.trim(),
    photoURL,
    admins: [me],
    createdBy: me,
    createdAt: serverTimestamp(),
    lastMessage: null,
    unreadCount: Object.fromEntries(members.map((m) => [m, 0])),
  });
  return ref.id;
}

export async function updateGroupInfo(chatId: string, data: { name?: string; photoURL?: string }): Promise<void> {
  await updateDoc(doc(db, 'chats', chatId), data);
}

export async function addGroupMembers(chatId: string, uids: string[]): Promise<void> {
  const updates: Record<string, unknown> = { members: arrayUnion(...uids) };
  uids.forEach((u) => (updates[`unreadCount.${u}`] = 0));
  await updateDoc(doc(db, 'chats', chatId), updates);
}

export async function removeGroupMember(chatId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, 'chats', chatId), { members: arrayRemove(uid), admins: arrayRemove(uid) });
}

export async function setGroupAdmin(chatId: string, uid: string, isAdmin: boolean): Promise<void> {
  await updateDoc(doc(db, 'chats', chatId), { admins: isAdmin ? arrayUnion(uid) : arrayRemove(uid) });
}

export function newCallId(): string {
  return doc(collection(db, 'chats')).id;
}

export function callUpdate(callId: string, callType: CallType, startedBy: string): Record<string, unknown> {
  return { activeCall: { callId, callType, startedBy, startedAt: serverTimestamp(), active: true } };
}

export async function endActiveCall(chatId: string): Promise<void> {
  await updateDoc(doc(db, 'chats', chatId), { 'activeCall.active': false }).catch(() => undefined);
}
