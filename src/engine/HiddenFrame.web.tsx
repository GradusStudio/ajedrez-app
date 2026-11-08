// Reemplazo web del WebView invisible: monta la misma página del motor en un iframe oculto con `sandbox`
// (origen opaco, sin acceso a la app) y le da el `window.ReactNativeWebView.postMessage` que esa página
// espera. Todo viaja por `postMessage` (ver frameShim.ts).
import React, { useEffect, useRef } from 'react';
import { FRAME_SHIM } from './frameShim';

export type FrameCall = { fn: 'sendToEngine' | 'sendToMaia'; arg: string };

type Props = {
  html: string;
  onMessage: (data: string) => void;
  /** Recibe la función que llama a `fn(arg)` dentro del iframe, o null al desmontar. */
  onSend: (send: ((call: FrameCall) => void) | null) => void;
};

export function HiddenFrame({ html, onMessage, onSend }: Props) {
  const ref = useRef<HTMLIFrameElement | null>(null);
  const onMessageRef = useRef(onMessage);
  const onSendRef = useRef(onSend);
  useEffect(() => {
    onMessageRef.current = onMessage;
    onSendRef.current = onSend;
  });

  useEffect(() => {
    const frame = ref.current!;
    const onWindowMessage = (e: MessageEvent) => {
      // Solo se acepta lo que manda este iframe y con la forma del shim.
      if (e.source !== frame.contentWindow) return;
      const d = e.data as { gradus?: number; m?: unknown } | null;
      if (d && d.gradus === 1 && typeof d.m === 'string') onMessageRef.current(d.m);
    };
    window.addEventListener('message', onWindowMessage);
    frame.srcdoc = FRAME_SHIM + html;
    // Si la página todavía no cargó, el mensaje se descarta (igual que en un WebView).
    onSendRef.current(({ fn, arg }) => frame.contentWindow?.postMessage({ fn, arg }, '*'));
    return () => {
      onSendRef.current(null);
      window.removeEventListener('message', onWindowMessage);
      frame.srcdoc = '';
    };
  }, [html]);

  return (
    <iframe
      ref={ref}
      sandbox="allow-scripts"
      aria-hidden
      tabIndex={-1}
      style={{ position: 'absolute', width: 1, height: 1, opacity: 0, border: 0 }}
    />
  );
}
