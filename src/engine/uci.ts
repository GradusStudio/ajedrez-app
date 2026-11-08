// Habla con un motor UCI por texto. No sabe nada de dónde corre el motor (hoy, un WebView):
// para cambiar de motor (por ejemplo, a Arasan) alcanza con cambiar quién recibe `send`.

/** Un FEN solo lleva letras, números, barras, puntos, guiones y espacios. Con otra cosa (un salto de línea, por ejemplo) se colarían comandos al motor. */
const FEN_PATTERN = /^[A-Za-z0-9/ .-]{1,100}$/;

/** Comando que fija la posición. Lanza un error si el FEN no tiene la forma de un FEN. */
export function positionCommand(fen: string): string {
  if (typeof fen !== 'string' || !FEN_PATTERN.test(fen)) throw new Error('FEN inválido');
  return `position fen ${fen}`;
}

export type EngineLine = {
  rank: number; // 1 = la mejor
  /** Evaluación en centipeones para el bando que mueve. Mate: ±(10000 − jugadas hasta el mate). */
  score: number;
  move: string; // primera jugada de la variante, en formato UCI (e2e4)
  pv: string[];
};

export type SearchOptions = {
  fen: string;
  multipv: number;
  depth?: number;
  movetime?: number;
  /** Si se indica, limita la fuerza con UCI_Elo (mínimo 1320 en Stockfish). */
  elo?: number;
};

export type SearchResult = { bestmove: string; lines: EngineLine[] };

/** Avance de un análisis: las mejores variantes hasta ahora. `done` = llegó a la profundidad pedida. */
export type AnalysisUpdate = { depth: number; lines: EngineLine[]; done: boolean };

const ANALYSIS_UPDATE_MS = 250; // cada cuánto se avisa del avance del análisis

const MIN_MOVETIME_MS = 100;

// Sin ninguna línea del motor durante este tiempo, se lo da por colgado. Mientras busca, Stockfish habla seguido.
const ENGINE_SILENCE_MS = 30_000;

type Waiter = {
  done: (line: string) => boolean;
  lines: string[];
  resolve: (lines: string[]) => void;
  reject: (e: Error) => void;
};

export class UciEngine {
  private waiters: Waiter[] = [];
  private queue: Promise<unknown> = Promise.resolve();
  private failure: Error | null = null;
  private watchdog: ReturnType<typeof setTimeout> | null = null;

  private onFailure?: (message: string) => void;

  constructor(private send: (cmd: string) => void = () => {}) {}

  /** `fn` se llama una vez, cuando el motor deja de funcionar. */
  setOnFailure(fn: (message: string) => void) {
    this.onFailure = fn;
  }

  /** Cambia por dónde salen los comandos (por ejemplo, cuando el WebView ya existe). */
  connect(send: (cmd: string) => void) {
    this.send = send;
  }

  get failed() {
    return this.failure !== null;
  }

  /** Empieza a contar el tiempo de silencio: si el motor no habla a tiempo, se lo da por colgado. */
  arm() {
    this.disarm();
    this.watchdog = setTimeout(() => this.fail('error: el motor no responde'), ENGINE_SILENCE_MS);
  }

  private disarm() {
    if (this.watchdog) clearTimeout(this.watchdog);
    this.watchdog = null;
  }

  /** El motor dejó de funcionar: corta todo lo que estaba esperando y avisa. */
  fail(message: string) {
    if (this.failure) return;
    const err = new Error(message);
    this.failure = err;
    this.disarm();
    this.waiters.splice(0).forEach((w) => w.reject(err));
    this.onFailure?.(message);
  }

  /** Al desmontar el WebView: nadie espera más al motor y ya no hay a quién avisar. */
  close() {
    this.onFailure = undefined;
    this.disarm();
    const err = new Error('motor cerrado');
    this.waiters.splice(0).forEach((w) => w.reject(err));
  }

  /** Cada línea que manda el motor. */
  receive(line: string) {
    if (line.startsWith('error')) {
      this.fail(line);
      return;
    }
    for (const w of [...this.waiters]) {
      w.lines.push(line);
      if (w.done(line)) {
        this.waiters.splice(this.waiters.indexOf(w), 1);
        w.resolve(w.lines);
      }
    }
    if (this.waiters.length > 0) this.arm();
    else this.disarm();
  }

  private waitFor(done: (line: string) => boolean): Promise<string[]> {
    if (this.failure) return Promise.reject(this.failure);
    this.arm();
    return new Promise((resolve, reject) => this.waiters.push({ done, lines: [], resolve, reject }));
  }

  /** Las búsquedas van de a una: si llega otra, espera a que termine la anterior. */
  private serial<T>(task: () => Promise<T>): Promise<T> {
    const next = this.queue.then(task, task);
    this.queue = next.catch(() => undefined);
    return next;
  }

  async init(): Promise<void> {
    const ok = this.waitFor((l) => l === 'uciok');
    this.send('uci');
    await ok;
    await this.ready();
  }

  private async ready() {
    const ok = this.waitFor((l) => l === 'readyok');
    this.send('isready');
    await ok;
  }

  search(o: SearchOptions): Promise<SearchResult> {
    return this.serial(async () => {
      this.send(`setoption name MultiPV value ${o.multipv}`);
      this.send(`setoption name UCI_LimitStrength value ${o.elo ? 'true' : 'false'}`);
      if (o.elo) this.send(`setoption name UCI_Elo value ${o.elo}`);
      await this.ready();
      this.send(positionCommand(o.fen));
      const done = this.waitFor((l) => l.startsWith('bestmove'));
      // Ojo: "go movetime 0" es "pensar sin límite" para Stockfish. Por eso hay un mínimo.
      this.send(o.depth ? `go depth ${o.depth}` : `go movetime ${Math.max(MIN_MOVETIME_MS, o.movetime ?? 1000)}`);
      return parseSearch(await done);
    });
  }

  /**
   * Análisis en vivo (pestaña Análisis): busca hasta `depth` y avisa el avance con `onUpdate`.
   * Devuelve la función que lo detiene (por ejemplo, al cambiar la posición).
   */
  analyze(o: { fen: string; multipv: number; depth: number }, onUpdate: (u: AnalysisUpdate) => void): () => void {
    let stopped = false;
    let running = false;
    this.serial(async () => {
      if (stopped) return;
      this.send(`setoption name MultiPV value ${o.multipv}`);
      this.send('setoption name UCI_LimitStrength value false');
      await this.ready();
      if (stopped) return;
      this.send(positionCommand(o.fen));
      const byRank = new Map<number, EngineLine>();
      let depth = 0;
      let lastUpdate = 0;
      const lines = () => [...byRank.values()].sort((a, b) => a.rank - b.rank);
      const done = this.waitFor((l) => {
        if (l.startsWith('bestmove')) return true;
        const info = parseInfo(l);
        // Las líneas "lowerbound/upperbound" son evaluaciones a medias: se saltean para que no salte.
        if (!info || info.bound || stopped) return false;
        byRank.set(info.line.rank, info.line);
        if (info.line.rank === 1) depth = info.depth;
        const now = Date.now();
        if (now - lastUpdate >= ANALYSIS_UPDATE_MS) {
          lastUpdate = now;
          onUpdate({ depth, lines: lines(), done: false });
        }
        return false;
      });
      running = true;
      this.send(`go depth ${o.depth}`);
      await done;
      running = false;
      if (!stopped) onUpdate({ depth, lines: lines(), done: true });
    }).catch(() => undefined);
    return () => {
      if (stopped) return;
      stopped = true;
      if (running) this.send('stop');
    };
  }

  stop() {
    this.send('stop');
  }
}

/** Lee una línea `info ... pv` del motor: la variante, su profundidad y si es una cota (bound). */
function parseInfo(l: string): { line: EngineLine; depth: number; bound: boolean } | null {
  if (!l.startsWith('info') || !l.includes(' pv ')) return null;
  const s = / score (cp|mate) (-?\d+)/.exec(l);
  if (!s) return null;
  const rank = Number(/ multipv (\d+)/.exec(l)?.[1] ?? 1);
  const n = Number(s[2]);
  const score = s[1] === 'cp' ? n : n > 0 ? 10000 - n : -10000 - n;
  const pv = l.slice(l.indexOf(' pv ') + 4).trim().split(' ');
  return {
    line: { rank, score, move: pv[0], pv },
    depth: Number(/ depth (\d+)/.exec(l)?.[1] ?? 0),
    bound: / (lowerbound|upperbound)/.test(l),
  };
}

/** Se queda con la última línea `info ... pv` de cada variante (multipv). */
export function parseSearch(lines: string[]): SearchResult {
  const byRank = new Map<number, EngineLine>();
  let bestmove = '';
  for (const l of lines) {
    if (l.startsWith('bestmove')) bestmove = l.split(' ')[1] ?? '';
    const info = parseInfo(l);
    if (info) byRank.set(info.line.rank, info.line);
  }
  const linesOut = [...byRank.values()].sort((a, b) => a.rank - b.rank);
  return { bestmove: bestmove && bestmove !== '(none)' ? bestmove : linesOut[0]?.move ?? '', lines: linesOut };
}
