import React, { useEffect, useState } from 'react';
import { buildEngineHtml } from './engineHtml';
import { HiddenFrame } from './HiddenFrame.web';
import { UciEngine } from './uci';

type Props = {
  /** El motor ya respondió `uciok` y `readyok`. */
  onReady: (engine: UciEngine) => void;
  onError: (message: string) => void;
};

let cachedHtml: Promise<string> | null = null;
const engineHtml = () => (cachedHtml ??= buildEngineHtml());

/** Versión web de EngineView: Stockfish corre en un iframe oculto. */
export function EngineView({ onReady, onError }: Props) {
  const [engine] = useState(() => new UciEngine());
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    engine.setOnFailure(onError);
  });

  useEffect(() => {
    let alive = true;
    engineHtml().then(
      (h) => {
        if (alive) setHtml(h);
      },
      (e) => {
        if (alive) onError(String((e as Error)?.message ?? e));
      }
    );
    return () => {
      alive = false;
    };
  }, [onError]);

  // Desde que el iframe existe ya cuenta el tiempo: si la página nunca arranca, también se avisa.
  useEffect(() => {
    if (!html) return;
    engine.arm();
    return () => engine.close();
  }, [engine, html]);

  if (!html) return null;
  return (
    <HiddenFrame
      html={html}
      onSend={(send) => engine.connect((cmd) => send?.({ fn: 'sendToEngine', arg: cmd }))}
      onMessage={(line) => {
        if (line === 'host ready') {
          engine.init().then(
            () => onReady(engine),
            () => {}
          );
        } else {
          engine.receive(line);
        }
      }}
    />
  );
}
