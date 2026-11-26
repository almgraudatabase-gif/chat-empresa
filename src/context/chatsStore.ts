import { create } from 'zustand';
import type { Chat } from '../types';

interface ChatsState {
  chats: Chat[];
  loading: boolean;
  error: string | null;
  setChats: (chats: Chat[]) => void;
  setError: (e: string | null) => void;
  reset: () => void;
}

export const useChatsStore = create<ChatsState>((set) => ({
  chats: [],
  loading: true,
  error: null,
  setChats: (chats) => set({ chats, loading: false, error: null }),
  setError: (error) => set({ error, loading: false }),
  reset: () => set({ chats: [], loading: true, error: null }),
}));
