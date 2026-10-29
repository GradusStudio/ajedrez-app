import React, { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { NodeState } from '../progress/path';
import { colors, fonts } from '../theme';
import { Circle3D } from './Circle3D';

export const NODE_SIZE = 64;
const RING_GAP = 4; // espacio entre el nodo y el anillo de la lección actual
const RING_WIDTH = 3;
const DEPTH = 4; // canto 3D del nodo
/** Lado del cuadrado que ocupa cada nodo con su anillo (HomeScreen lo usa para ubicarlos). */
export const NODE_BOX = NODE_SIZE + 2 * (RING_GAP + RING_WIDTH);

type Props = { state: NodeState; order: number; label: string; onPress: () => void };

const LOOK: Record<NodeState, { bg: string; edge: string; text: string }> = {
  done: { bg: colors.primary, edge: colors.primaryShadow, text: '#FFFFFF' },
  current: { bg: colors.primary, edge: colors.primaryShadow, text: '#FFFFFF' },
  open: { bg: colors.surfaceRaised, edge: colors.surfaceShadow, text: colors.text },
  locked: { bg: colors.surfaceRaised, edge: colors.surfaceShadow, text: colors.outline },
};

// Nodo circular de la ruta de lecciones, con canto 3D. El actual tiene anillo y late suavemente.
export function LessonNode({ state, order, label, onPress }: Props) {
  const [pulse] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (state !== 'current') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [state, pulse]);

  const look = LOOK[state];
  const status = { done: 'completada', current: 'actual', open: 'disponible', locked: 'bloqueada' }[state];

  return (
    <Animated.View style={[styles.box, { transform: [{ scale: pulse }] }]}>
      {state === 'current' && <View style={styles.ring} />}
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Lección ${order}: ${label}, ${status}`}
        style={styles.node}
      >
        {({ pressed }) => (
          <Circle3D size={NODE_SIZE} color={look.bg} edge={look.edge} depth={DEPTH} pressed={pressed}>
            <Text style={[styles.text, { color: look.text }]}>{state === 'done' ? '✓' : order}</Text>
          </Circle3D>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: { width: NODE_BOX, height: NODE_BOX },
  ring: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: NODE_BOX,
    height: NODE_BOX,
    borderRadius: NODE_BOX / 2,
    borderWidth: RING_WIDTH,
    borderColor: colors.primary,
  },
  // El nodo queda centrado en el anillo; el canto asoma por debajo, dentro del anillo.
  node: { position: 'absolute', left: RING_GAP + RING_WIDTH, top: RING_GAP + RING_WIDTH - DEPTH / 2 },
  text: { fontFamily: fonts.extrabold, fontSize: 22 },
});
