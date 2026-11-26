import { create } from 'zustand';

type Theme = 'light' | 'dark';

function initialTheme(): Theme {
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(t: Theme) {
  document.documentElement.classList.toggle('dark', t === 'dark');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#111b21' : '#075e54');
}

interface ToastItem {
  id: number;
  text: string;
  kind: 'error' | 'info';
}

interface UiState {
  theme: Theme;
  toasts: ToastItem[];
  toggleTheme: () => void;
  toast: (text: string, kind?: 'error' | 'info') => void;
  dismissToast: (id: number) => void;
}

let nextId = 1;

export const useUiStore = create<UiState>((set, get) => ({
  theme: initialTheme(),
  toasts: [],
  toggleTheme() {
    const t: Theme = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', t);
    applyTheme(t);
    set({ theme: t });
  },
  toast(text, kind = 'error') {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, text, kind }] }));
    window.setTimeout(() => get().dismissToast(id), 5000);
  },
  dismissToast(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));
