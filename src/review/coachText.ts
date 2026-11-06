import type { BotStyle } from '../data/bots';
import de from './coach/de.json';
import en from './coach/en.json';
import es from './coach/es.json';
import fr from './coach/fr.json';
import it from './coach/it.json';
import { isBad } from './types';
import type { LineFacts } from './lines';
import type { PlanKind } from './plans';
import type { TacticKind } from './tactics';
import type { Facts, MoveQuality, PieceKind } from './types';

// Voz del comentarista. Las opiniones salen de plantillas por estilo del personaje; los hechos
// (qué capturó, qué permite, qué se dejó pasar) vienen ya verificados con el tablero (build.ts):
// aquí solo se ponen en palabras. Los textos de cada idioma están en `coach/<idioma>.json`
// (de, it y fr traducidos con IA, sin revisión de nativos; las claves de `frame`, `opp`, `you` y `line`
// están por ahora en inglés en esos tres idiomas; `intent`, `verdict` y `why` ya están traducidas). Sin React Native.

export type CoachLang = 'es' | 'en' | 'de' | 'it' | 'fr';
const LANGS: CoachLang[] = ['es', 'en', 'de', 'it', 'fr'];
export const coachLang = (language: string): CoachLang =>
  (LANGS as string[]).includes(language) ? (language as CoachLang) : 'en';

export type VoiceKey = MoveQuality | 'great' | 'mate';
export type Subject = 'you' | 'opponent';

type OppKey = 'ok' | 'inaccuracy' | 'mistake' | 'blunder' | 'mate';
type ExplKey =
  | 'didMate' | 'didCheck' | 'didCapture' | 'didCastle'
  | 'allowsMateYou' | 'allowsMateOpp' | 'allowsCaptureMoved' | 'allowsCaptureYou' | 'allowsCaptureOpp'
  | 'allowsCheckYou' | 'allowsCheckOpp'
  | 'missedMateYou' | 'missedMateOpp' | 'missedBestYou' | 'missedBestOpp'
  | 'bestBecauseYou' | 'bestBecauseOpp'
  | 'threatFree' | 'threatValue';

type MateKey = 'foundYou' | 'foundOpp' | 'allowsYou' | 'allowsOpp';
type TactTexts = Record<'you' | 'opp', Record<TacticKind, string[]>>;
type Bad = 'inaccuracy' | 'mistake' | 'blunder';
/** Por qué era mejor la jugada recomendada: cláusulas que siguen a «porque». */
type WhyKey = 'capture' | TacticKind | 'threatFree' | 'threatValue' | 'develop' | 'center' | 'rookFile' | 'pawnBreak' | 'kingActive' | 'trade';
/**
 * Situación de la explicación de una jugada mala: el rival erró (exploit); el error es propio y hay algo que permitió (allows) o solo se
 * dejó pasar algo mejor (miss, sin marco). Solo exploit y allows tienen cola con la voz del bot.
 */
type Situation = 'exploit' | 'allows' | 'miss';
/** Texto de una línea del motor: la usa quien explota el error (exploit), quien lo sufre (allows) o la oportunidad perdida (missed). */
type LineSituation = 'exploit' | 'allows' | 'missed';
type IntentKind = Extract<PlanKind, 'develop' | 'center' | 'rookFile' | 'pawnBreak' | 'pawnAdvance' | 'kingActive' | 'retreat'>;

/** Largo máximo (en caracteres) del párrafo de la explicación. */
export const EXPLANATION_CAP = 320;

// Convención: las tácticas (tact.*) son listas de variantes elegidas con la semilla; mateIn y plan
// son una sola frase. En plan, {piece} va en minúscula con artículo ("el caballo") y {Piece} con
// la primera letra en mayúscula, para empezar frase. `frame` es el marco del estilo: `good` abre el
// párrafo de una jugada buena y `exploit`/`allows` cierran con una cola con la voz del bot cuando
// hay error. `line` dice la línea del motor ({first} y {finish} son la primera y la tercera jugada,
// {seq} la secuencia, {n} los puntos de material), `intent` dice qué buscaba la jugada (solo en
// jugadas malas, y se le agrega `verdict`: «..., pero es un error.»), y `why` son las cláusulas que
// siguen a «La mejor jugada era X, porque ...».
type Texts = {
  you: Record<BotStyle, Record<VoiceKey, string[]>>;
  opp: Record<BotStyle, Record<OppKey, string[]>>;
  frame: Record<BotStyle, { exploit: { tail: string[] }; allows: { tail: string[] }; good: { lead: string[] } }>;
  line: { removeDefender: Record<LineSituation, string[]>; material: Record<LineSituation, string[]> };
  intent: Record<IntentKind, string[]>;
  verdict: Record<Bad, string>;
  why: Record<WhyKey, string>;
  // `pieces` lleva artículo indefinido ("un caballo", para lo capturado); `pieceDef` el definido ("el caballo", sujeto o
  // complemento con preposición) y `pieceObj` el complemento directo ("al rey", "a la torre"; igual que pieceDef en inglés).
  pieces: Record<PieceKind, string>;
  expl: Record<ExplKey, string>;
  tact: { found: TactTexts; allows: TactTexts };
  mateIn: Record<MateKey, string>;
  plan: Record<PlanKind, string>;
  and: string;
  pieceDef: Record<PieceKind, string>;
  pieceObj: Record<PieceKind, string>;
};

export const TEXTS: Record<CoachLang, Texts> = { es, en, de, it, fr } as Record<CoachLang, Texts>;

const fill = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k: string) => v[k] ?? '');

const pick = (list: string[], seed: number) => list[Math.abs(seed) % list.length];

/** Opinión del comentarista sobre la jugada (una frase). `move` ya viene en la notación del usuario. */
export function coachVoice(o: {
  lang: CoachLang;
  style: BotStyle;
  quality: MoveQuality;
  great: boolean;
  mate: boolean;
  subject: Subject;
  move: string;
  seed: number;
}): string {
  const tx = TEXTS[o.lang];
  const key: VoiceKey = o.mate ? 'mate' : o.great ? 'great' : o.quality;
  if (o.subject === 'you') return fill(pick(tx.you[o.style][key], o.seed), { move: o.move });
  const k: OppKey = o.mate ? 'mate' : isBad(o.quality) ? o.quality : 'ok';
  return fill(pick(tx.opp[o.style][k], o.seed), { move: o.move });
}

const INTENT_KINDS: PlanKind[] = ['develop', 'center', 'rookFile', 'pawnBreak', 'pawnAdvance', 'kingActive', 'retreat'];
/** Planes que explican por qué una jugada era la mejor (los demás, como avanzar un peón, no dicen nada útil). */
const REASON_PLANS: PlanKind[] = ['develop', 'center', 'rookFile', 'pawnBreak', 'kingActive', 'trade'];
// Cuántas variantes distintas se prueban, como mucho, para que el párrafo entre en el tope (acortar es cambiar a una variante sin {seq}).
const VARIANT_TRIES = 4;

/** Un trozo del párrafo; `k` corre la variante elegida con la semilla (se prueba con k = 0, 1, ... hasta que el párrafo entre en el tope). */
type Part = (k: number) => string;

type ExplainOptions = {
  lang: CoachLang;
  subject: Subject;
  quality: MoveQuality;
  facts: Facts;
  move: string;
  bestSan: string;
  fmt: (san: string) => string;
  seed?: number;
  style: BotStyle;
};

/** Herramientas comunes para poner hechos en palabras. */
function kit(o: ExplainOptions) {
  const tx = TEXTS[o.lang];
  const seed = o.seed ?? 0;
  const { fmt } = o;
  const fixed = (s: string): Part => () => s;
  const variant = (list: string[], salt: number, vars: () => Record<string, string> = () => ({}), index = seed + salt): Part =>
    (k) => fill(pick(list, index + k), { move: o.move, ...vars() });
  const say = (key: ExplKey, v: Record<string, string> = {}): Part => fixed(fill(tx.expl[key], { move: o.move, ...v }));
  const piece = (k: PieceKind) => tx.pieces[k];
  const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
  const def = (k: PieceKind) => tx.pieceDef[k];
  const list = (ks: PieceKind[], table: Record<PieceKind, string>) => {
    const names = [...new Set(ks)].map((k) => table[k]);
    return names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} ${tx.and} ${names[names.length - 1]}`;
  };
  const tacticVars = (t: { attacker: PieceKind; targets: PieceKind[] }) => ({ attacker: def(t.attacker), targets: list(t.targets, tx.pieceObj), targetsDef: list(t.targets, tx.pieceDef) });
  // Datos comunes de una línea del motor; `seq` muestra siempre las primeras 3 jugadas (o todas si hay menos), nunca una parte.
  const lineVars = (l: LineFacts) => () => ({
    first: fmt(l.sans[0]),
    finish: l.sans[2] ? fmt(l.sans[2]) : '',
    seq: l.sans.slice(0, 3).map(fmt).join(' '),
    n: String(l.material),
  });
  const planVars = (x: { piece: PieceKind; from: string; to: string }) => ({ piece: def(x.piece), Piece: cap(def(x.piece)), from: x.from, to: x.to });
  return { tx, seed, you: o.subject === 'you', fixed, variant, say, piece, cap, def, tacticVars, lineVars, planVars };
}

/**
 * Dice el párrafo más largo que entra en `EXPLANATION_CAP`: prueba otras variantes (las que no llevan {seq} son las cortas:
 * una secuencia nunca se muestra recortada, porque afirma una ganancia) y, si ninguna entra, pasa al siguiente diseño de `layouts`
 * (cada uno quita algo del anterior). Si ni el último entra, se queda con su variante más corta.
 */
function fit<L>(layouts: L[], render: (l: L, k: number) => string): string {
  for (const l of layouts)
    for (let k = 0; k < VARIANT_TRIES; k++) {
      const text = render(l, k);
      if (text.length <= EXPLANATION_CAP) return text;
    }
  const last = layouts[layouts.length - 1];
  return Array.from({ length: VARIANT_TRIES }, (_, k) => render(last, k)).reduce((x, y) => (y.length < x.length ? y : x));
}

const join = (parts: string[]) => parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
const stripPeriod = (s: string) => s.replace(/\.$/, '');

/**
 * La explicación de una jugada en la voz del bot: un único párrafo. En una jugada buena, un lead del estilo y como mucho dos hechos
 * verificados (mate, táctica, amenaza, lo que hizo la jugada y, al final, su plan). En una jugada mala, en cambio:
 * 1. lo que hacía la jugada seguido del veredicto («La idea era sacar el caballo de b1 hacia a3, pero es un error.»);
 * 2. un hecho de por qué falla (mate permitido, eliminar al defensor, táctica o captura permitida, material de la línea del motor);
 * 3. la mejor jugada y por qué lo era (mate, línea del motor, captura, táctica, amenaza o plan de esa jugada);
 * 4. una cola corta con la voz del bot (solo si el rival erró o el error permitió algo).
 * Si no entra en `EXPLANATION_CAP` se quita primero la cola, luego el hecho de por qué falla y por último lo que hacía la jugada.
 * Devuelve `[]` si no hay nada que decir: en una jugada mala, lo que hacía la jugada solo no dice nada.
 * `fmt` pasa una jugada de notación inglesa a la del usuario; `seed` elige entre las variantes.
 */
export function coachExplanation(o: ExplainOptions): string[] {
  const text = isBad(o.quality) ? explainMistake(o) : explainGood(o);
  return text ? [text] : [];
}

function explainGood(o: ExplainOptions): string | undefined {
  const { facts } = o;
  const { tx, you, fixed, variant, say, piece, cap, def, tacticVars, planVars } = kit(o);
  const side = you ? 'you' : 'opp';
  const parts: Part[] = [];

  if (facts.mateIn) {
    const { n, mover } = facts.mateIn;
    const key: MateKey = mover ? (you ? 'foundYou' : 'foundOpp') : you ? 'allowsYou' : 'allowsOpp';
    parts.push(fixed(fill(tx.mateIn[key], { n: String(n) })));
  }
  if (facts.did?.kind === 'mate') parts.push(say('didMate'));
  (facts.found ?? []).forEach((t, i) => parts.push(variant(tx.tact.found[side][t.kind], i, () => tacticVars(t))));
  if (facts.threat) {
    const t = facts.threat;
    parts.push(say(t.free ? 'threatFree' : 'threatValue', { Attacker: cap(def(t.attacker)), target: tx.pieceObj[t.target], sq: t.square }));
  }
  const d = facts.did;
  if (d?.kind === 'check') parts.push(say('didCheck'));
  else if (d?.kind === 'capture') parts.push(say('didCapture', { piece: piece(d.piece) }));
  else if (d?.kind === 'castle') parts.push(say('didCastle'));
  // El plan de una jugada buena es un mérito más.
  if (facts.plan && !facts.did && !facts.found) parts.push(fixed(fill(tx.plan[facts.plan.kind], { ...planVars(facts.plan), move: o.move })));

  const chosen = parts.slice(0, 2);
  if (chosen.length === 0) return undefined;
  const lead = variant(tx.frame[o.style].good.lead, 0);
  const layouts = [chosen.length, ...(chosen.length > 1 ? [1] : [])];
  return fit(layouts, (n, k) => join([lead(k), ...chosen.slice(0, n).map((f) => f(k))]));
}

function explainMistake(o: ExplainOptions): string | undefined {
  const { facts, fmt } = o;
  const { tx, you, fixed, variant, say, piece, cap, def, tacticVars, lineVars, planVars } = kit(o);
  const quality = o.quality as Bad;
  const lineKey: LineSituation = you ? 'allows' : 'exploit';
  const best = o.bestSan ? fmt(o.bestSan) : '';

  // 1. Lo que hacía la jugada, con el veredicto: «..., pero es un error.»
  let what: Part | undefined;
  const d = facts.did;
  if (d?.kind === 'check') what = say('didCheck');
  else if (d?.kind === 'capture') what = say('didCapture', { piece: piece(d.piece) });
  else if (d?.kind === 'castle') what = say('didCastle');
  else if (facts.plan && !facts.found && INTENT_KINDS.includes(facts.plan.kind)) {
    const p = facts.plan;
    what = variant(tx.intent[p.kind as IntentKind], 2, () => planVars(p));
  }
  const s1: Part | undefined = what && ((k) => `${stripPeriod(what(k))}, ${tx.verdict[quality]}`);

  // 2. Por qué falla: el primer hecho de lo que permite (o, si erró el rival, de lo que se puede aprovechar).
  const line = facts.line;
  const problem: Part[] = [];
  if (facts.mateIn && !facts.mateIn.mover) problem.push(fixed(fill(tx.mateIn[you ? 'allowsYou' : 'allowsOpp'], { n: String(facts.mateIn.n) })));
  const a = facts.allows;
  if (a?.kind === 'mate') problem.push(say(you ? 'allowsMateYou' : 'allowsMateOpp', { san: fmt(a.san) }));
  if (line?.removeDefender && line.sans.length >= 3) {
    const rd = line.removeDefender;
    const vars = lineVars(line);
    problem.push(variant(tx.line.removeDefender[lineKey], 2, () => ({ ...vars(), capturer: def(rd.capturer), removed: def(rd.removed), target: def(rd.target), targetSq: rd.targetSq })));
  }
  if (facts.allowsTactic) {
    const { tactic, san } = facts.allowsTactic;
    problem.push(variant(tx.tact.allows[you ? 'you' : 'opp'][tactic.kind], 0, () => ({ ...tacticVars(tactic), san: fmt(san) })));
  }
  if (line && !line.removeDefender && line.material >= 2) problem.push(variant(tx.line.material[lineKey], 2, lineVars(line)));
  // Con la línea del motor, su primera jugada ya dice la captura o el jaque permitidos: no se repiten.
  if (a && a.kind !== 'mate') {
    const san = fmt(a.san);
    if (a.kind === 'capture' && !line) problem.push(say(you ? (a.ofMoved ? 'allowsCaptureMoved' : 'allowsCaptureYou') : 'allowsCaptureOpp', { san, piece: piece(a.piece) }));
    else if (a.kind === 'check' && !line) problem.push(say(you ? 'allowsCheckYou' : 'allowsCheckOpp', { san }));
  }
  // Sin nada que permita, lo útil es la amenaza que la jugada crea (hay que responderla).
  const t = facts.threat;
  const threatSentence = t && say(t.free ? 'threatFree' : 'threatValue', { Attacker: cap(def(t.attacker)), target: tx.pieceObj[t.target], sq: t.square });
  const s2: Part | undefined = problem[0] ?? threatSentence;

  // 3. La mejor jugada y por qué lo era.
  const because = (why: WhyKey, vars: Record<string, string> = {}): Part =>
    fixed(fill(tx.expl[you ? 'bestBecauseYou' : 'bestBecauseOpp'], { best, why: fill(tx.why[why], vars) }));
  const m = facts.missed;
  const missedLine = facts.missedLine;
  const bw = facts.bestWhy;
  let s3: Part | undefined;
  if (best && m?.kind === 'mate') s3 = say(you ? 'missedMateYou' : 'missedMateOpp', { best });
  else if (missedLine?.removeDefender && missedLine.sans.length >= 3) {
    const rd = missedLine.removeDefender;
    const vars = lineVars(missedLine);
    s3 = variant(tx.line.removeDefender.missed, 2, () => ({ ...vars(), capturer: def(rd.capturer), removed: def(rd.removed), target: def(rd.target), targetSq: rd.targetSq }));
  } else if (missedLine && !missedLine.removeDefender && missedLine.material >= 2) s3 = variant(tx.line.material.missed, 3, lineVars(missedLine));
  else if (best) {
    if (m?.kind === 'capture') s3 = because('capture', { piece: piece(m.piece) });
    else if (bw?.found?.[0]) s3 = because(bw.found[0].kind, tacticVars(bw.found[0]));
    // «Porque» afirma una causa: una amenaza o un plan solo se dan como razón si la jugada jugada no hacía lo mismo.
    else if (bw?.threat && bw.threat.square !== facts.threat?.square) s3 = because(bw.threat.free ? 'threatFree' : 'threatValue', { attacker: def(bw.threat.attacker), target: tx.pieceObj[bw.threat.target], sq: bw.threat.square });
    else if (bw?.plan && REASON_PLANS.includes(bw.plan.kind) && bw.plan.kind !== facts.plan?.kind) s3 = because(bw.plan.kind as WhyKey, planVars(bw.plan));
    else s3 = say(you ? 'missedBestYou' : 'missedBestOpp', { best });
  }
  if (!s2 && !s3) return undefined;

  // 4. Cola con la voz del bot: solo cuando el rival erró o el error permitió algo.
  const allowsFact = !!(line || a || facts.allowsTactic || (facts.mateIn && !facts.mateIn.mover));
  const situation: Situation = you ? (allowsFact ? 'allows' : 'miss') : 'exploit';
  const tails = situation === 'miss' ? undefined : tx.frame[o.style][situation].tail;
  const tail: Part | undefined = tails && variant(tails, 0, () => ({}), Math.floor((o.seed ?? 0) / 2));

  type Layout = { s1: boolean; s2: boolean; tail: boolean };
  // Lo que se quita primero va al final: la cola, luego el hecho de por qué falla (si queda la mejor jugada) y por último la idea.
  let cur: Layout = { s1: !!s1, s2: !!s2, tail: !!tail };
  const layouts: Layout[] = [cur];
  if (cur.tail) layouts.push((cur = { ...cur, tail: false }));
  if (cur.s2 && s3) layouts.push((cur = { ...cur, s2: false }));
  if (cur.s1 && (cur.s2 || s3)) layouts.push((cur = { ...cur, s1: false }));
  return fit(layouts, (l, k) => join([l.s1 && s1 ? s1(k) : '', l.s2 && s2 ? s2(k) : '', s3 ? s3(k) : '', l.tail && tail ? tail(k) : '']));
}
