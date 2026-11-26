import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  GridLayout,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useLocalParticipant,
  useMediaDeviceSelect,
  useParticipants,
  useRoomContext,
  useTracks,
} from '@livekit/components-react';
import { RoomEvent, Track } from 'livekit-client';
import '@livekit/components-styles';
import { useAuth } from '../context/AuthContext';
import { useChatsStore } from '../context/chatsStore';
import { useChatMeta } from '../hooks/useChatMeta';
import { apiPost } from '../services/api';
import { callUpdate, endActiveCall, newCallId } from '../services/chats';
import { sendMessage } from '../services/messages';
import { LIVEKIT_URL } from '../utils/config';
import type { CallType } from '../types';
import { Avatar } from '../components/Avatar';
import { Icon, type IconName } from '../components/Icon';
import { Spinner } from '../components/Spinner';
import { cx } from '../utils/format';


function CircleButton({ icon, label, onClick, active = true, danger = false }: {
  icon: IconName; label: string; onClick: () => void; active?: boolean; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cx(
        'flex h-14 w-14 items-center justify-center rounded-full text-white transition',
        danger ? 'bg-red-600 hover:bg-red-700' : active ? 'bg-white/20 hover:bg-white/30' : 'bg-white text-gray-900',
      )}
    >
      <Icon name={icon} className="h-7 w-7" />
    </button>
  );
}


function CallStage({ chatId, video, title }: { chatId: string; video: boolean; title: string }) {
  const room = useRoomContext();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
  const participants = useParticipants();
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }], { onlySubscribed: false });
  const cams = useMediaDeviceSelect({ kind: 'videoinput' });


  // Si alguien se va y esta persona se queda sola en la sala, la llamada termina.
  // (Aplica igual a llamadas individuales y de grupo.)
  useEffect(() => {
    const onLeft = () => {
      if (room.remoteParticipants.size === 0) {
        void endActiveCall(chatId);
        void room.disconnect();
      }
    };
    room.on(RoomEvent.ParticipantDisconnected, onLeft);
    return () => {
      room.off(RoomEvent.ParticipantDisconnected, onLeft);
    };
  }, [room, chatId]);


  const hangUp = () => {
    // Si no queda nadie más, la llamada se marca como terminada para todos.
    if (room.remoteParticipants.size === 0) void endActiveCall(chatId);
    void room.disconnect();
  };


  const switchCamera = () => {
    const devices = cams.devices;
    if (devices.length < 2) return;
    const idx = devices.findIndex((d) => d.deviceId === cams.activeDeviceId);
    const next = devices[(idx + 1) % devices.length];
    void cams.setActiveMediaDevice(next.deviceId);
  };


  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-3 text-center text-white">
        <p className="font-medium">{title}</p>
        <p className="text-xs text-white/70">
          {participants.length > 1 ? `${participants.length} participantes` : 'Esperando a que se unan…'}
        </p>
      </div>
      <div className="min-h-0 flex-1 p-2">
        {video || participants.length > 0 ? (
          <GridLayout tracks={tracks} style={{ height: '100%' }}>
            <ParticipantTile />
          </GridLayout>
        ) : null}
      </div>
      <RoomAudioRenderer />
      <div className="flex items-center justify-center gap-4 p-5 pb-8">
        <CircleButton
          icon={isMicrophoneEnabled ? 'mic' : 'micOff'}
          label={isMicrophoneEnabled ? 'Silenciar' : 'Activar micrófono'}
          active={isMicrophoneEnabled}
          onClick={() => void localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
        />
        <CircleButton
          icon={isCameraEnabled ? 'video' : 'videoOff'}
          label={isCameraEnabled ? 'Apagar cámara' : 'Encender cámara'}
          active={isCameraEnabled}
          onClick={() => void localParticipant.setCameraEnabled(!isCameraEnabled)}
        />
        {isCameraEnabled && cams.devices.length > 1 && (
          <CircleButton icon="flip" label="Cambiar cámara" onClick={switchCamera} />
        )}
        <CircleButton icon="hangup" label="Colgar" danger onClick={hangUp} />
      </div>
    </div>
  );
}


export default function CallPage() {
  const { chatId = '' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const chat = useChatsStore((s) => s.chats.find((c) => c.id === chatId));
  const chatsLoading = useChatsStore((s) => s.loading);
  const meta = useChatMeta(chat, user?.uid ?? '');
  const callType: CallType = params.get('type') === 'video' ? 'video' : 'audio';
  const mode = params.get('mode') === 'join' ? 'join' : 'start';
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);


  const leave = () => navigate(chatId ? `/chat/${chatId}` : '/', { replace: true });


  useEffect(() => {
    if (!user || !chat || started.current) return;
    started.current = true;
    void (async () => {
      try {
        const res = await apiPost<{ token: string }>('livekit-token', { chatId });
        if (mode === 'start') {
          // Mensaje type "call" + activeCall (activa pantalla entrante y push en los demás)
          await sendMessage(chat, user.uid, { type: 'call', callType }, callUpdate(newCallId(), callType, user.uid));
        }
        setToken(res.token);
      } catch (e) {
        setError((e as Error).message || 'No se pudo iniciar la llamada.');
      }
    })();
  }, [user, chat, chatId, mode, callType]);


  if (!user) return null;
  if (!chat && !chatsLoading) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-gray-900 text-white">
        <p>Chat no encontrado.</p>
        <button onClick={leave} className="rounded bg-brand px-4 py-2">Volver</button>
      </div>
    );
  }


  return (
    <div data-lk-theme="default" className="fixed inset-0 z-[60] bg-gray-900">
      {error ? (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center text-white">
          <p className="max-w-sm">{error}</p>
          <button onClick={leave} className="rounded bg-brand px-4 py-2">Volver al chat</button>
        </div>
      ) : !token || !chat ? (
        <div className="flex h-full flex-col items-center justify-center gap-4 text-white">
          <Avatar name={meta.name || '?'} photoURL={meta.photoURL} size={96} group={chat?.type === 'group'} />
          <p className="text-lg">{mode === 'start' ? 'Llamando…' : 'Conectando…'}</p>
          <Spinner className="h-8 w-8 border-white border-t-transparent" />
        </div>
      ) : (
        <LiveKitRoom
          token={token}
          serverUrl={LIVEKIT_URL}
          connect
          audio
          video={callType === 'video'}
          onDisconnected={leave}
          onError={(e) => setError(e.message)}
          className="h-full"
        >
          <CallStage chatId={chatId} video={callType === 'video'} title={meta.name} />
        </LiveKitRoom>
      )}
    </div>
  );
}