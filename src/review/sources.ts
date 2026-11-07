// Partidas de chess.com y Lichess por nombre de usuario (APIs públicas, sin cuenta ni clave).
// El análisis de las respuestas es puro y se prueba aparte; fetch es el de React Native.

import { fetchHeaders } from './userAgent';

export type GameSource = 'chesscom' | 'lichess';

export type ListedGame = {
  id: string;
  source: GameSource;
  white: string;
  black: string;
  whiteRating?: number;
  blackRating?: number;
  result: '1-0' | '0-1' | '1/2-1/2';
  /** Milisegundos desde 1970. */
  date: number;
  speed: string; // bullet, blitz, rapid, classical, daily…
  pgn: string;
};

export type FetchError = 'notFound' | 'network' | 'empty';
export type FetchResult = { ok: true; games: ListedGame[] } | { ok: false; error: FetchError };

export const GAMES_SHOWN = 30;

/** Los nombres de usuario solo llevan letras, números, guiones y guiones bajos. */
export const cleanUsername = (s: string) => s.trim().replace(/^@/, '');
export const validUsername = (s: string) => /^[A-Za-z0-9_-]{2,40}$/.test(s);

type ChessComGame = {
  url?: string;
  pgn?: string;
  end_time?: number;
  time_class?: string;
  white?: { username?: string; rating?: number; result?: string };
  black?: { username?: string; rating?: number; result?: string };
};

export function parseChessComMonth(json: unknown): ListedGame[] {
  const games = (json as { games?: ChessComGame[] } | null)?.games ?? [];
  const out: ListedGame[] = [];
  for (const g of games) {
    if (!g.pgn || !g.white?.username || !g.black?.username) continue;
    const result = g.white.result === 'win' ? '1-0' : g.black.result === 'win' ? '0-1' : '1/2-1/2';
    out.push({
      id: g.url ?? `${g.end_time}-${g.white.username}`,
      source: 'chesscom',
      white: g.white.username,
      black: g.black.username,
      whiteRating: g.white.rating,
      blackRating: g.black.rating,
      result,
      date: (g.end_time ?? 0) * 1000,
      speed: g.time_class ?? '',
      pgn: g.pgn,
    });
  }
  return out.sort((a, b) => b.date - a.date);
}

type LichessGame = {
  id?: string;
  createdAt?: number;
  lastMoveAt?: number;
  speed?: string;
  winner?: 'white' | 'black';
  pgn?: string;
  players?: {
    white?: { user?: { name?: string }; rating?: number; aiLevel?: number };
    black?: { user?: { name?: string }; rating?: number; aiLevel?: number };
  };
};

const lichessName = (p?: { user?: { name?: string }; aiLevel?: number }) =>
  p?.user?.name ?? (p?.aiLevel ? `Stockfish ${p.aiLevel}` : 'Anónimo');

/** Cada línea es una partida en JSON (formato ndjson). Las líneas rotas se saltean. */
export function parseLichessNdjson(text: string): ListedGame[] {
  const out: ListedGame[] = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    let g: LichessGame;
    try {
      g = JSON.parse(line) as LichessGame;
    } catch {
      continue;
    }
    if (!g.id || !g.pgn) continue;
    out.push({
      id: g.id,
      source: 'lichess',
      white: lichessName(g.players?.white),
      black: lichessName(g.players?.black),
      whiteRating: g.players?.white?.rating,
      blackRating: g.players?.black?.rating,
      result: g.winner === 'white' ? '1-0' : g.winner === 'black' ? '0-1' : '1/2-1/2',
      date: g.lastMoveAt ?? g.createdAt ?? 0,
      speed: g.speed ?? '',
      pgn: g.pgn,
    });
  }
  return out.sort((a, b) => b.date - a.date);
}

async function getJson(url: string): Promise<{ status: number; json?: unknown }> {
  const res = await fetch(url, { headers: fetchHeaders('application/json') });
  if (!res.ok) return { status: res.status };
  return { status: res.status, json: await res.json() };
}

export async function fetchChessComGames(username: string): Promise<FetchResult> {
  try {
    const user = encodeURIComponent(username.toLowerCase());
    const archives = await getJson(`https://api.chess.com/pub/player/${user}/games/archives`);
    if (archives.status === 404 || archives.status === 410) return { ok: false, error: 'notFound' };
    if (!archives.json) return { ok: false, error: 'network' };
    const urls = ((archives.json as { archives?: string[] }).archives ?? []).slice(-3).reverse();
    const games: ListedGame[] = [];
    for (const url of urls) {
      if (games.length >= GAMES_SHOWN) break;
      const month = await getJson(url);
      if (month.json) games.push(...parseChessComMonth(month.json));
    }
    return games.length ? { ok: true, games: games.slice(0, GAMES_SHOWN) } : { ok: false, error: 'empty' };
  } catch {
    return { ok: false, error: 'network' };
  }
}

export async function fetchLichessGames(username: string): Promise<FetchResult> {
  try {
    const user = encodeURIComponent(username);
    const res = await fetch(
      `https://lichess.org/api/games/user/${user}?max=${GAMES_SHOWN}&pgnInJson=true&clocks=false&evals=false&opening=false`,
      { headers: fetchHeaders('application/x-ndjson') }
    );
    if (res.status === 404) return { ok: false, error: 'notFound' };
    if (!res.ok) return { ok: false, error: 'network' };
    const games = parseLichessNdjson(await res.text());
    return games.length ? { ok: true, games } : { ok: false, error: 'empty' };
  } catch {
    return { ok: false, error: 'network' };
  }
}

export const fetchGames = (source: GameSource, username: string) =>
  source === 'chesscom' ? fetchChessComGames(username) : fetchLichessGames(username);
