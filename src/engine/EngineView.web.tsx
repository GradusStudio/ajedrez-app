import React, { useEffect, useState } from 'react';
import { buildEngineHtml } from './engineHtml';
import { HiddenFrame } from './HiddenFrame.web';
import { UciEngine } from './uci';

type Props = {
  /** El motor ya respondió `uciok` y `readyok`. */
  onReady: (engine: UciEngine) => void;
  onError: (message: string) => void;
};

let cachedHtml: string | null = null;
const engineHtml = () => (cachedHtml ??= buildEngineHtml());

/** Versión web de EngineView: Stockfish corre en un iframe oculto. */
export function EngineView({ onReady, onError }: Props) {
  const [engine] = useState(() => new UciEngine());

  useEffect(() => {
    engine.setOnFailure(onError);
  });

  // Desde que se monta ya cuenta el tiempo: si la página nunca arranca, también se avisa.
  useEffect(() => {
    engine.arm();
    return () => engine.close();
  }, [engine]);

  return (
    <HiddenFrame
      html={engineHtml()}
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
