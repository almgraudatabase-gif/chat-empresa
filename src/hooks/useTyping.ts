import { useCallback, useEffect, useRef, useState } from 'react';
import { setTyping, subscribeTyping } from '../services/messages';

const IDLE_MS = 2500;
const REFRESH_MS = 4000;
const VISIBLE_MS = 6000;

/** "Escribiendo...": escribe con debounce (máx. 1 escritura cada 4 s) y escucha a los demás. */
export function useTyping(chatId: string, uid: string) {
  const [typingUids, setTypingUids] = useState<string[]>([]);
  const lastWrite = useRef(0);
  const flagged = useRef(false);
  const idleTimer = useRef<number | undefined>(undefined);
  const expiry = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const timers = expiry.current;
    const unsub = subscribeTyping(chatId, (uids) => {
      const others = uids.filter((u) => u !== uid);
      others.forEach((u) => {
        window.clearTimeout(timers.get(u));
        // Si no llega otra actualización, se oculta solo (evita "escribiendo" fantasma)
        timers.set(u, window.setTimeout(() => setTypingUids((p) => p.filter((x) => x !== u)), VISIBLE_MS));
      });
      setTypingUids(others);
    });
    return () => {
      unsub();
      timers.forEach((t) => window.clearTimeout(t));
      timers.clear();
      window.clearTimeout(idleTimer.current);
      if (flagged.current) {
        flagged.current = false;
        void setTyping(chatId, uid, false).catch(() => undefined);
      }
      setTypingUids([]);
    };
  }, [chatId, uid]);

  const stop = useCallback(() => {
    window.clearTimeout(idleTimer.current);
    if (flagged.current) {
      flagged.current = false;
      lastWrite.current = 0;
      void setTyping(chatId, uid, false).catch(() => undefined);
    }
  }, [chatId, uid]);

  const notifyTyping = useCallback(() => {
    const now = Date.now();
    if (!flagged.current || now - lastWrite.current > REFRESH_MS) {
      flagged.current = true;
      lastWrite.current = now;
      void setTyping(chatId, uid, true).catch(() => undefined);
    }
    window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(stop, IDLE_MS);
  }, [chatId, uid, stop]);

  return { typingUids, notifyTyping, stopTyping: stop };
}
