import React, { useEffect, useState } from 'react';
import { Chess, Square } from 'chess.js';
import { BoardLayout } from '../../components/BoardLayout';
import { Board } from '../../components/Board';
import { FadeIn } from '../../components/FadeIn';
import { ExplainStep as ExplainStepData } from '../../data/lessonTypes';
import { LESSON_RESERVE } from '../stepTypes';
import { TeacherBubble } from '../TeacherBubble';

// El tablero va siempre arriba, en el mismo lugar; el texto va debajo (en pantalla ancha, a su derecha).
export function ExplainStep({ step }: { step: ExplainStepData }) {
  const [fen, setFen] = useState(step.fen);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);

  // Reproduce solas las jugadas de `play`, una cada 1,2 s.
  useEffect(() => {
    if (!step.play || step.play.length === 0) return;
    const chess = new Chess(step.fen);
    const timers: ReturnType<typeof setTimeout>[] = [];
    step.play.forEach((uci, i) => {
      timers.push(
        setTimeout(() => {
          try {
            const from = uci.slice(0, 2) as Square;
            const to = uci.slice(2, 4) as Square;
            chess.move({ from, to, promotion: uci[4] });
            setFen(chess.fen());
            setLastMove({ from, to });
          } catch {
            // jugada inválida: se ignora
          }
        }, 900 + i * 1200)
      );
    });
    return () => timers.forEach(clearTimeout);
  }, [step]);

  return (
    <BoardLayout
      reserveHeight={LESSON_RESERVE}
      board={
        <>
          <Board
            fen={fen}
            orientation={step.orientation ?? 'w'}
            interactive={false}
            lastMove={lastMove}
            highlight={step.play ? undefined : step.highlight}
            arrows={step.play ? undefined : step.arrows}
            showMovesFrom={step.play ? undefined : step.showMovesFrom}
          />
        </>
      }
    >
      <FadeIn>
        <TeacherBubble>{step.text}</TeacherBubble>
      </FadeIn>
    </BoardLayout>
  );
}
