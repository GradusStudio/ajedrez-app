// Reemplazo web del WebView invisible: monta la misma página del motor en un iframe oculto del
// mismo origen y le da el `window.ReactNativeWebView.postMessage` que esa página espera.
import React, { useEffect, useRef } from 'react';

export type FrameCall = { fn: 'sendToEngine' | 'sendToMaia'; arg: string };

type Props = {
  html: string;
  onMessage: (data: string) => void;
  /** Recibe la función que llama a `fn(arg)` dentro del iframe, o null al desmontar. */
  onSend: (send: ((call: FrameCall) => void) | null) => void;
};

let seq = 0;

export function HiddenFrame({ html, onMessage, onSend }: Props) {
  const ref = useRef<HTMLIFrameElement | null>(null);
  const onMessageRef = useRef(onMessage);
  const onSendRef = useRef(onSend);
  useEffect(() => {
    onMessageRef.current = onMessage;
    onSendRef.current = onSend;
  });

  useEffect(() => {
    const key = `__gradusFrame${++seq}`;
    const w = window as unknown as Record<string, unknown>;
    w[key] = (m: string) => onMessageRef.current(m);
    const shim = `<script>window.ReactNativeWebView={postMessage:function(m){parent[${JSON.stringify(key)}](m);}};</script>`;
    const frame = ref.current!;
    frame.srcdoc = shim + html;
    onSendRef.current(({ fn, arg }) => {
      const target = frame.contentWindow as unknown as Record<string, unknown> | null;
      const f = target?.[fn];
      // Si la página todavía no cargó, el mensaje se descarta (igual que en un WebView).
      if (typeof f === 'function') (f as (a: string) => void).call(target, arg);
    });
    return () => {
      onSendRef.current(null);
      delete w[key];
      frame.srcdoc = '';
    };
  }, [html]);

  return (
    <iframe
      ref={ref}
      aria-hidden
      tabIndex={-1}
      style={{ position: 'absolute', width: 1, height: 1, opacity: 0, border: 0 }}
    />
  );
}
