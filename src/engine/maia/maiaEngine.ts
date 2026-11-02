import type { MaiaInput } from './encode';

// Habla con el Worker de Maia (ver maiaHtml.ts) por JSON. No sabe dónde corre: hoy, en un WebView.

export type MaiaResult = {
  /** Logit de cada jugada pedida (mismo orden que `input.moves`). */
  logits: number[];
  /** Probabilidad de ganar, empatar y perder del bando que mueve, según cómo juegan las personas de ese nivel. */
  wdl: [number, number, number];
};

// Sin respuesta en este tiempo, se da al motor por colgado. Una evaluación tarda menos de un segundo.
const MAIA_SILENCE_MS = 30_000;

type Pending = { resolve: (r: MaiaResult) => void; reject: (e: Error) => void };

export class MaiaEngine {
  private pending = new Map<number, Pending>();
  private nextId = 1;
  private failure: Error | null = null;
  private watchdog: ReturnType<typeof setTimeout> | null = null;
  private onFailure?: (message: string) => void;
  private onReady?: () => void;

  constructor(private send: (json: string) => void = () => {}) {}

  setOnFailure(fn: (message: string) => void) {
    this.onFailure = fn;
  }

  setOnReady(fn: () => void) {
    this.onReady = fn;
  }

  connect(send: (json: string) => void) {
    this.send = send;
  }

  get failed() {
    return this.failure !== null;
  }

  /** Empieza a contar el silencio: si el motor no contesta a tiempo, se lo da por colgado. */
  arm() {
    this.disarm();
    this.watchdog = setTimeout(() => this.fail('Maia no responde'), MAIA_SILENCE_MS);
  }

  private disarm() {
    if (this.watchdog) clearTimeout(this.watchdog);
    this.watchdog = null;
  }

  fail(message: string) {
    if (this.failure) return;
    const err = new Error(message);
    this.failure = err;
    this.disarm();
    this.pending.forEach((p) => p.reject(err));
    this.pending.clear();
    this.onFailure?.(message);
  }

  close() {
    this.onFailure = undefined;
    this.onReady = undefined;
    this.disarm();
    const err = new Error('motor cerrado');
    this.pending.forEach((p) => p.reject(err));
    this.pending.clear();
  }

  /** Cada mensaje (JSON) que manda la página. */
  receive(json: string) {
    let m: { type?: string; id?: number; logits?: number[]; wdl?: number[]; message?: string };
    try {
      m = JSON.parse(json);
    } catch {
      return;
    }
    if (m.type === 'ready') {
      this.disarm();
      this.onReady?.();
    } else if (m.type === 'result' && m.id !== undefined) {
      const p = this.pending.get(m.id);
      this.pending.delete(m.id);
      p?.resolve({ logits: m.logits ?? [], wdl: (m.wdl ?? [0, 1, 0]) as MaiaResult['wdl'] });
    } else if (m.type === 'error') {
      // Un error de una evaluación es de esa jugada; uno sin id es del motor (no cargó la red).
      const p = m.id !== undefined ? this.pending.get(m.id) : undefined;
      if (p && m.id !== undefined) {
        this.pending.delete(m.id);
        p.reject(new Error(m.message ?? 'error'));
      } else {
        this.fail(m.message ?? 'error');
      }
    }
    if (this.pending.size > 0) this.arm();
    else if (m.type !== 'ready') this.disarm();
  }

  evaluate(input: MaiaInput): Promise<MaiaResult> {
    if (this.failure) return Promise.reject(this.failure);
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.arm();
      this.send(JSON.stringify({ type: 'eval', id, input }));
    });
  }
}

/** Evaluación en centipeones a partir de [gana, tablas, pierde] (la fórmula de Lc0 para mostrar Q como cp). */
export function wdlToCentipawns([w, , l]: readonly number[]): number {
  const q = Math.max(-0.999, Math.min(0.999, w - l));
  return Math.max(-3000, Math.min(3000, Math.round(90 * Math.tan(1.5637541897 * q))));
}
