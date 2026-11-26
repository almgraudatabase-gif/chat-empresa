import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChatsStore } from '../context/chatsStore';
import { useUiStore } from '../context/uiStore';
import { useMessages } from '../hooks/useMessages';
import { useTyping } from '../hooks/useTyping';
import { deleteForAll, deleteForMe } from '../services/messages';
import type { Message } from '../types';
import { ChatHeader } from '../components/ChatHeader';
import { GroupInfoPanel } from '../components/GroupInfoPanel';
import { ImageViewer } from '../components/ImageViewer';
import { MessageInput } from '../components/MessageInput';
import { MessageList } from '../components/MessageList';
import { Spinner } from '../components/Spinner';

export default function ChatRoomPage() {
  const { chatId = '' } = useParams();
  const { user } = useAuth();
  const { chats, loading } = useChatsStore();
  const chat = chats.find((c) => c.id === chatId);

  if (!user) return null;
  if (!chat) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-chatbg p-6 text-center dark:bg-chatbg-dark dark:text-gray-200">
        {loading ? (
          <Spinner />
        ) : (
          <>
            <p>Este chat no existe o ya no eres miembro.</p>
            <Link to="/" className="text-brand underline">Volver a mis chats</Link>
          </>
        )}
      </div>
    );
  }
  return <ChatRoom key={chat.id} chatId={chat.id} me={user.uid} />;
}

function ChatRoom({ chatId, me }: { chatId: string; me: string }) {
  const chat = useChatsStore((s) => s.chats.find((c) => c.id === chatId));
  const toast = useUiStore((s) => s.toast);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [viewer, setViewer] = useState<string | null>(null);
  const [info, setInfo] = useState(false);

  const unread = chat?.unreadCount[me] ?? 0;
  const { messages, loading, loadingMore, hasMore, error, loadMore } = useMessages(chatId, me, unread);
  const { typingUids, notifyTyping, stopTyping } = useTyping(chatId, me);

  const onDelete = useCallback(
    (m: Message, forAll: boolean) => {
      const p = forAll ? deleteForAll(chatId, m.id) : deleteForMe(chatId, m.id, me);
      p.catch(() => toast('No se pudo borrar el mensaje.'));
    },
    [chatId, me, toast],
  );

  if (!chat) return null;

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <ChatHeader chat={chat} me={me} typingUids={typingUids} onOpenInfo={() => setInfo(true)} />
      <MessageList
        chat={chat}
        messages={messages}
        me={me}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        error={error}
        onLoadMore={() => void loadMore()}
        onReply={setReplyTo}
        onDelete={onDelete}
        onOpenImage={setViewer}
      />
      <MessageInput
        chat={chat}
        me={me}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        onTyping={notifyTyping}
        onStopTyping={stopTyping}
      />
      {viewer && <ImageViewer url={viewer} onClose={() => setViewer(null)} />}
      {info && chat.type === 'group' && <GroupInfoPanel chat={chat} me={me} onClose={() => setInfo(false)} />}
    </div>
  );
}
