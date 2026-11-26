import { useEffect } from 'react';

/** Tono de llamada generado con WebAudio (sin archivos) + vibración mientras `active` sea true. */
export function useRingtone(active: boolean) {
  useEffect(() => {
    if (!active) return;
    let ctx: AudioContext | null = null;
    try {
      ctx = new AudioContext();
    } catch {
      ctx = null;
    }
    const beep = () => {
      if (ctx && ctx.state === 'running') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 440;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1);
      }
      navigator.vibrate?.([300, 150, 300]);
    };
    void ctx?.resume().catch(() => undefined);
    beep();
    const timer = window.setInterval(beep, 2500);
    return () => {
      window.clearInterval(timer);
      navigator.vibrate?.(0);
      void ctx?.close().catch(() => undefined);
    };
  }, [active]);
}
