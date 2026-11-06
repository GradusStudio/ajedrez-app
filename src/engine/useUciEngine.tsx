import React, { useCallback, useState } from 'react';
import { EngineView } from './EngineView';
import { UciEngine } from './uci';

/**
 * Stockfish listo para usar en una pantalla. Hay que dibujar `view` UNA vez en el árbol de la pantalla
 * (en un solo lugar, para que el WebView no se reinicie al cambiar de vista). `enabled = false` lo apaga.
 */
export function useUciEngine(enabled = true) {
  const [engine, setEngine] = useState<UciEngine | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState(0);

  // Al apagarlo se descarta el motor cerrado (se ajusta durante el render, no en un efecto).
  const [wasEnabled, setWasEnabled] = useState(enabled);
  if (wasEnabled !== enabled) {
    setWasEnabled(enabled);
    if (!enabled) {
      setEngine(null);
      setError(null);
    }
  }

  const retry = useCallback(() => {
    setError(null);
    setEngine(null);
    setKey((k) => k + 1);
  }, []);

  const view = enabled && !error ? <EngineView key={key} onReady={setEngine} onError={setError} /> : null;
  return { engine, error, retry, view };
}
