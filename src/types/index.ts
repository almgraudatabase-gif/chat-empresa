import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  lastSeen: Timestamp | null;
  online: boolean;
}

export type MessageType = 'text' | 'image' | 'file' | 'sticker' | 'call' | 'audio' | 'video';
export type CallType = 'audio' | 'video';

export interface LastMessage {
  id: string;
  text: string;
  senderId: string;
  createdAt: Timestamp | null;
  type: MessageType;
  callType?: CallType;
}

export interface ActiveCall {
  callId: string;
  callType: CallType;
  startedBy: string;
  startedAt: Timestamp | null;
  active: boolean;
}

export interface Chat {
  id: string;
  type: 'direct' | 'group';
  members: string[];
  name: string;
  photoURL: string;
  admins: string[];
  createdBy: string;
  createdAt: Timestamp | null;
  lastMessage: LastMessage | null;
  unreadCount: Record<string, number>;
  activeCall: ActiveCall | null;
}

export interface ReplyRef {
  messageId: string;
  senderId: string;
  text: string;
  type: MessageType;
}

export interface Message {
  id: string;
  senderId: string;
  type: MessageType;
  text: string;
  mediaUrl: string;
  fileName: string;
  fileSize: number;
  duration: number;
  replyTo: ReplyRef | null;
  createdAt: Timestamp | null;
  deliveredTo: string[];
  readBy: string[];
  deletedFor: string[];
  deletedForAll: boolean;
  callType?: CallType;
  pending: boolean;
}

export interface OutgoingMessage {
  type: MessageType;
  text?: string;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  replyTo?: ReplyRef | null;
  callType?: CallType;
}
