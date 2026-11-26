import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { fetchOlderMessages, markMessagesRead, subscribeLatestMessages } from '../services/messages';
import type { Message } from '../types';

/**
 * Mensajes de un chat: listener en tiempo real de los últimos 30 + paginación hacia atrás.
 * El listener se cancela al salir del chat (cleanup del efecto).
 */
export function useMessages(chatId: string, uid: string, unreadCount: number) {
  const [byId, setById] = useState<Map<string, Message>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cursorRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const initialised = useRef(false);

  useEffect(() => {
    setById(new Map());
    setLoading(true);
    setHasMore(false);
    setError(null);
    cursorRef.current = null;
    initialised.current = false;
    const unsub = subscribeLatestMessages(
      chatId,
      (page) => {
        setById((prev) => {
          const next = new Map(prev);
          page.messages.forEach((m) => next.set(m.id, m));
          return next;
        });
        if (!initialised.current) {
          initialised.current = true;
          cursorRef.current = page.cursor;
          setHasMore(page.hasMore);
        }
        setLoading(false);
      },
      () => {
        setError('No se pudieron cargar los mensajes.');
        setLoading(false);
      },
    );
    return unsub;
  }, [chatId]);

  const loadMore = useCallback(async () => {
    const cursor = cursorRef.current;
    if (!cursor || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchOlderMessages(chatId, cursor);
      cursorRef.current = page.cursor ?? cursor;
      setHasMore(page.hasMore);
      setById((prev) => {
        const next = new Map(prev);
        page.messages.forEach((m) => {
          if (!next.has(m.id)) next.set(m.id, m);
        });
        return next;
      });
    } catch {
      setError('No se pudieron cargar mensajes anteriores.');
    } finally {
      setLoadingMore(false);
    }
  }, [chatId, hasMore, loadingMore]);

  const messages = useMemo(
    () =>
      [...byId.values()]
        .filter((m) => !m.deletedFor.includes(uid))
        .sort((a, b) => (a.createdAt?.toMillis() ?? Number.MAX_SAFE_INTEGER) - (b.createdAt?.toMillis() ?? Number.MAX_SAFE_INTEGER)),
    [byId, uid],
  );

  // Marcar como leídos los mensajes ajenos mientras el chat está abierto y visible.
  const unreadIds = useMemo(
    () => messages.filter((m) => m.senderId !== uid && !m.readBy.includes(uid) && !m.pending).map((m) => m.id),
    [messages, uid],
  );
  const markingRef = useRef(false);
  useEffect(() => {
    if (document.visibilityState !== 'visible' || markingRef.current) return;
    if (unreadIds.length === 0 && unreadCount === 0) return;
    markingRef.current = true;
    void markMessagesRead(chatId, uid, unreadIds, unreadCount > 0)
      .catch(() => undefined)
      .finally(() => {
        markingRef.current = false;
      });
  }, [chatId, uid, unreadIds, unreadCount]);

  return { messages, loading, loadingMore, hasMore, error, loadMore };
}
