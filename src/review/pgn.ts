import { Chess } from 'chess.js';
import type { ParsedGame } from './types';

// Lee un PGN y reproduce la partida con chess.js. Sin React Native.

export const MAX_PLIES = 240; // tope para que el análisis no dure una eternidad
/** Tope del texto del PGN: una partida de 240 jugadas con comentarios pesa mucho menos. Se mira antes de cargarla. */
export const MAX_PGN_CHARS = 200_000;

/** Si el texto trae varias partidas, se queda con la primera. */
function firstGame(text: string): string {
  const t = text.replace(/^﻿/, '').trim();
  const second = t.search(/\n\s*\[Event\s/i);
  const starts = (t.match(/\[Event\s/gi) ?? []).length;
  return starts > 1 && second > 0 ? t.slice(0, second) : t;
}

/** Cabecera PGN para mostrar: sin caracteres de control y con un largo razonable. */
export function cleanPgnHeader(value: unknown, max = 80): string {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
    : '';
}

/** null si el texto no es una partida legal (o no tiene jugadas). */
export function parseGame(pgn: string): ParsedGame | null {
  if (pgn.length > MAX_PGN_CHARS) return null;
  const text = firstGame(pgn);
  if (!text) return null;
  const chess = new Chess();
  try {
    chess.loadPgn(text);
  } catch {
    return null;
  }
  const history = chess.history({ verbose: true });
  if (history.length === 0) return null;
  const headers = chess.getHeaders();
  const moves = history.slice(0, MAX_PLIES).map((m) => ({
    san: m.san,
    uci: `${m.from}${m.to}${m.promotion ?? ''}`,
    color: m.color,
    fenBefore: m.before,
    fenAfter: m.after,
  }));
  return {
    white: cleanPgnHeader(headers.White !== '?' ? headers.White : ''),
    black: cleanPgnHeader(headers.Black !== '?' ? headers.Black : ''),
    result: cleanPgnHeader(headers.Result, 8) || '*',
    startFen: moves[0].fenBefore,
    moves,
  };
}
