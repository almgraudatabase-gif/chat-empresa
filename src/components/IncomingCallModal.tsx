import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useChatsStore } from '../context/chatsStore';
import { useChatMeta } from '../hooks/useChatMeta';
import { useRingtone } from '../hooks/useRingtone';
import type { Chat } from '../types';
import { Avatar } from './Avatar';
import { Icon } from './Icon';

const RING_WINDOW_MS = 45_000;
const dismissed = new Set<string>();

function IncomingCard({ chat, me, onDismiss }: { chat: Chat; me: string; onDismiss: () => void }) {
  const navigate = useNavigate();
  const meta = useChatMeta(chat, me);
  const call = chat.activeCall;
  useRingtone(true);
  if (!call) return null;
  const video = call.callType === 'video';

  return (
    <div className="fixed inset-0 z-[90] flex flex-col items-center justify-between bg-gradient-to-b from-brand-deeper to-gray-900 px-6 py-16 text-white">
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-sm uppercase tracking-wide text-white/70">{video ? 'Videollamada entrante' : 'Llamada entrante'}</p>
        <Avatar name={meta.name || '?'} photoURL={meta.photoURL} size={112} group={chat.type === 'group'} />
        <h2 className="text-2xl font-semibold">{meta.name}</h2>
        {chat.type === 'group' && <p className="text-sm text-white/70">Llamada grupal</p>}
      </div>
      <div className="flex gap-16">
        <button onClick={onDismiss} aria-label="Rechazar" className="flex flex-col items-center gap-2">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600">
            <Icon name="hangup" className="h-8 w-8" />
          </span>
          <span className="text-sm">Rechazar</span>
        </button>
        <button
          onClick={() => {
            onDismiss();
            navigate(`/call/${chat.id}?type=${call.callType}&mode=join`);
          }}
          aria-label="Contestar"
          className="flex flex-col items-center gap-2"
        >
          <span className="flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-green-500">
            <Icon name={video ? 'video' : 'phone'} className="h-8 w-8" />
          </span>
          <span className="text-sm">Contestar</span>
        </button>
      </div>
    </div>
  );
}

/** Pantalla de llamada entrante, activada por chat.activeCall (que se crea junto al mensaje type "call"). */
export function IncomingCallModal({ me }: { me: string }) {
  const chats = useChatsStore((s) => s.chats);
  const location = useLocation();
  const [, force] = useState(0);

  // Reevalúa al cumplirse la ventana de timbre
  useEffect(() => {
    const t = window.setInterval(() => force((n) => n + 1), 3000);
    return () => window.clearInterval(t);
  }, []);

  if (location.pathname.startsWith('/call/')) return null;
  const incoming = chats.find((c) => {
    const a = c.activeCall;
    if (!a || !a.active || a.startedBy === me || dismissed.has(a.callId)) return false;
    const started = a.startedAt?.toMillis() ?? Date.now();
    return Date.now() - started < RING_WINDOW_MS;
  });
  if (!incoming?.activeCall) return null;
  const callId = incoming.activeCall.callId;
  return (
    <IncomingCard
      key={callId}
      chat={incoming}
      me={me}
      onDismiss={() => {
        dismissed.add(callId);
        force((n) => n + 1);
      }}
    />
  );
}
