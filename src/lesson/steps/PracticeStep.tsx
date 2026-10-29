import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Chess, Square } from 'chess.js';
import { Board, BoardMove } from '../../components/Board';
import { Button3D } from '../../components/Button3D';
import { FadeIn } from '../../components/FadeIn';
import { EngineView } from '../../engine/EngineView';
import { UciEngine } from '../../engine/uci';
import { PracticeStep as PracticeStepData } from '../../data/lessonTypes';
import { StepCallbacks } from '../stepTypes';
import { colors, fonts, space } from '../../theme';

type Props = { step: PracticeStepData } & StepCallbacks;

// Profundidad con la que Stockfish evalúa cada jugada y elige la respuesta. En finales simples es rápida.
const PRACTICE_DEPTH = 14;
// Evaluación (en centipeones, para el usuario) que cuenta como "sigue ganando" o, en `draw`, como "ya pierde".
// Medido con Stockfish: rey y peón ganado da +5,7; tablas, cerca de 0. Los mates dan miles.
const WIN_CP = 300;
const LOSING_CP = -300;
// Pausa mínima antes de que el motor responda, para que se vea la jugada propia.
const REPLY_DELAY_MS = 400;

type Move = { from: Square; to: Square };

/**
 * Final contra Stockfish. El usuario juega libre; después de cada jugada el motor evalúa la posición
 * (y con esa misma búsqueda elige su respuesta). Solo es error una jugada que deja escapar el resultado.
 */
export function PracticeStep({ step, onCorrect, onWrong, locked }: Props) {
  const [engine, setEngine] = useState<UciEngine | null>(null);
  const [engineError, setEngineError] = useState(false);
  const [engineKey, setEngineKey] = useState(0);
  const [chess] = useState(() => new Chess(step.fen));
  const [fen, setFen] = useState(step.fen);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [moves, setMoves] = useState(0); // jugadas propias hechas
  const [thinking, setThinking] = useState(false);
  const [done, setDone] = useState(false);
  // Jugada equivocada a la vista (posición aparte: la partida real no cambia) hasta "Reintentar".
  const [wrong, setWrong] = useState<{ fen: string; move: Move } | null>(null);

  const draw = step.goal === 'draw';
  const userTurn = !!engine && !thinking && !done && !wrong && chess.turn() === step.side;

  const restart = () => {
    chess.load(step.fen);
    setFen(step.fen);
    setLastMove(null);
    setMoves(0);
    setWrong(null);
  };

  const finish = (from: Square, to: Square) => {
    setFen(chess.fen());
    setLastMove({ from, to });
    setDone(true);
    onCorrect(step.success);
  };

  const fail = (probe: Chess, move: Move, message: string) => {
    setWrong({ fen: probe.fen(), move });
    onWrong(message, () => setWrong(null));
  };

  const handleMove = async (m: BoardMove) => {
    if (!engine || !userTurn || locked) return;
    const probe = new Chess(chess.fen());
    let played;
    try {
      played = probe.move({ from: m.from, to: m.to, promotion: m.promotion });
    } catch {
      return;
    }
    const move = { from: m.from as Square, to: m.to as Square };

    // Lo que chess.js ya resuelve solo: mate y tablas.
    if (probe.isCheckmate()) {
      chess.move(played.san);
      return finish(move.from, move.to);
    }
    if (probe.isDraw()) {
      if (draw) {
        chess.move(played.san);
        return finish(move.from, move.to);
      }
      return fail(
        probe,
        move,
        probe.isStalemate() ? 'Ahogaste al rey: la partida termina en tablas. Deja siempre una casilla libre.' : 'Así la partida termina en tablas.'
      );
    }

    // Stockfish evalúa la posición nueva (juega el rival) y, de paso, elige su respuesta.
    setWrong({ fen: probe.fen(), move }); // se ve la jugada mientras piensa
    setThinking(true);
    let result;
    try {
      const started = Date.now();
      result = await engine.search({ fen: probe.fen(), multipv: 1, depth: PRACTICE_DEPTH });
      const wait = REPLY_DELAY_MS - (Date.now() - started);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    } catch {
      setThinking(false);
      setWrong(null);
      setEngineError(true);
      return;
    }
    setThinking(false);
    const userScore = -(result.lines[0]?.score ?? 0);
    const kept = draw ? userScore > LOSING_CP : userScore >= WIN_CP;
    if (!kept) return fail(probe, move, step.hint);

    setWrong(null);
    chess.move(played.san);
    const count = moves + 1;
    setMoves(count);
    if ((step.goal === 'promote' && played.promotion) || (draw && count >= step.maxMoves)) {
      return finish(move.from, move.to);
    }
    if (count >= step.maxMoves) {
      setFen(chess.fen());
      setLastMove(move);
      onWrong(`Se terminaron las ${step.maxMoves} jugadas. Prueba de nuevo desde el principio.`, restart);
      return;
    }

    // Respuesta del motor.
    const reply = result.bestmove;
    const rf = reply.slice(0, 2) as Square;
    const rt = reply.slice(2, 4) as Square;
    try {
      chess.move({ from: rf, to: rt, promotion: reply[4] });
    } catch {
      setFen(chess.fen());
      setLastMove(move);
      return;
    }
    setFen(chess.fen());
    setLastMove({ from: rf, to: rt });
    // Si el rival captura lo último que quedaba (tablas por material), en `draw` ya se logró.
    if (draw && chess.isDraw()) {
      setDone(true);
      onCorrect(step.success);
    }
  };

  const status = engineError
    ? 'No se pudo iniciar Stockfish'
    : !engine
      ? 'Preparando a Stockfish…'
      : done
        ? 'Objetivo cumplido'
        : thinking
          ? 'Stockfish piensa…'
          : draw
            ? `Tu turno · aguanta ${step.maxMoves - moves} jugadas más`
            : `Tu turno · jugada ${moves + 1} de ${step.maxMoves}`;

  return (
    <View>
      {!engineError && (
        <EngineView key={engineKey} onReady={setEngine} onError={() => setEngineError(true)} />
      )}
      <Board
        fen={wrong?.fen ?? fen}
        orientation={step.orientation ?? step.side}
        interactive={userTurn && !locked}
        lastMove={wrong?.move ?? lastMove}
        onMove={handleMove}
      />
      <View style={{ height: space.lg }} />
      <FadeIn>
        <Text style={styles.prompt}>{step.prompt}</Text>
      </FadeIn>
      <Text style={styles.turn}>
        {status} · {step.side === 'w' ? 'juegas con blancas' : 'juegas con negras'}
      </Text>

      {engineError && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>No se pudo iniciar el motor de ajedrez. Prueba otra vez.</Text>
          <Button3D
            label="Reintentar"
            variant="danger"
            onPress={() => {
              setEngineError(false);
              setEngine(null);
              setEngineKey((k) => k + 1);
            }}
            style={{ marginTop: space.sm }}
          />
        </View>
      )}

      {!!engine && moves > 0 && !done && !thinking && !locked && (
        <Button3D label="Empezar de nuevo" onPress={restart} style={{ marginTop: space.md }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  prompt: { fontFamily: fonts.bold, fontSize: 18, color: colors.text, lineHeight: 26 },
  turn: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textMuted, marginTop: space.xs },
  errorCard: { marginTop: space.md },
  errorText: { fontFamily: fonts.bold, fontSize: 14, color: colors.danger, lineHeight: 20 },
});
