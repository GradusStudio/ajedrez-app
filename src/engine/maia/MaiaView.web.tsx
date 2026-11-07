import React, { useEffect, useState } from 'react';
import { HiddenFrame } from '../HiddenFrame.web';
import { MaiaEngine } from './maiaEngine';
import { MaiaNetId } from './nets';
import { useMaiaHtml } from './useMaiaHtml';

type Props = {
  /** Red de Maia: el nivel de juego humano que imita. */
  net: MaiaNetId;
  /** La red ya cargó y Maia puede evaluar posiciones. */
  onReady: (engine: MaiaEngine) => void;
  onError: (message: string) => void;
};

/** Versión web de MaiaView: Maia corre en un iframe oculto. */
export function MaiaView({ net, onReady, onError }: Props) {
  const [engine] = useState(() => new MaiaEngine());
  const html = useMaiaHtml(net, onError);

  useEffect(() => {
    engine.setOnFailure(onError);
    engine.setOnReady(() => onReady(engine));
  });

  useEffect(() => {
    engine.arm();
    return () => engine.close();
  }, [engine]);

  // Mientras la red carga no se monta nada; el reloj de arm() ya corre.
  if (!html) return null;

  return (
    <HiddenFrame
      html={html}
      onSend={(send) => engine.connect((json) => send?.({ fn: 'sendToMaia', arg: json }))}
      onMessage={(data) => engine.receive(data)}
    />
  );
}
