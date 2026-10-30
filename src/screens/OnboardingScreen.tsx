import React, { useState } from 'react';
import { Pressable, StatusBar as RNStatusBar, StyleSheet, Text, View } from 'react-native';
import { Button3D } from '../components/Button3D';
import { PlayerLevel } from '../progress/progressStore';
import { colors, fonts, radius, space } from '../theme';

type Props = {
  onFinish: (choice: { level?: PlayerLevel; dailyGoalMin?: number }) => void;
};

const LEVELS: { value: PlayerLevel; label: string; description: string }[] = [
  { value: 'nuevo', label: 'Nunca jugué', description: 'Empezamos desde cómo se mueve cada pieza.' },
  { value: 'basico', label: 'Sé mover las piezas', description: 'Conoces las reglas y quieres jugar mejor.' },
  { value: 'casual', label: 'Juego de vez en cuando', description: 'Ya jugaste partidas y quieres aprender aperturas y táctica.' },
];

const GOALS = [
  { value: 5, label: '5 minutos', description: 'Una lección corta o un par de puzzles.' },
  { value: 10, label: '10 minutos', description: 'Lo recomendado para avanzar sin apuro.' },
  { value: 15, label: '15 minutos', description: 'Para avanzar rápido.' },
];

// Primera vez que se abre la app: bienvenida, nivel y meta diaria. Todo se puede saltar (mapa-de-pantallas.md, 2.2).
export function OnboardingScreen({ onFinish }: Props) {
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState<PlayerLevel | undefined>();

  return (
    <View style={[styles.screen, { paddingTop: (RNStatusBar.currentHeight ?? 40) + space.lg }]}>
      <View style={styles.top}>
        <View style={styles.dots} accessibilityLabel={`Paso ${step + 1} de 3`}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, i <= step && styles.dotOn]} />
          ))}
        </View>
        <Pressable onPress={() => onFinish({ level })} accessibilityRole="button" hitSlop={12}>
          <Text style={styles.skip}>Saltar</Text>
        </Pressable>
      </View>

      {step === 0 && (
        <View style={styles.body}>
          <Text style={styles.emoji}>♞</Text>
          <Text style={styles.brand}>Gradus</Text>
          <Text style={styles.title}>Aprende ajedrez paso a paso</Text>
          <Text style={styles.text}>
            Lecciones cortas, aperturas, puzzles y bots que juegan como personas. Si te equivocas, ves una pista y
            vuelves a intentar.
          </Text>
          <View style={{ flex: 1 }} />
          <Button3D label="Empezar" variant="primary" onPress={() => setStep(1)} />
        </View>
      )}

      {step === 1 && (
        <View style={styles.body}>
          <Text style={styles.title}>¿Cuánto sabes de ajedrez?</Text>
          <Text style={styles.text}>Sirve para elegir la dificultad inicial de los puzzles. Puedes cambiarla cuando quieras.</Text>
          <View style={{ height: space.lg }} />
          {LEVELS.map((l) => (
            <Choice
              key={l.value}
              label={l.label}
              description={l.description}
              onPress={() => {
                setLevel(l.value);
                setStep(2);
              }}
            />
          ))}
        </View>
      )}

      {step === 2 && (
        <View style={styles.body}>
          <Text style={styles.title}>¿Cuánto quieres practicar por día?</Text>
          <Text style={styles.text}>Es tu meta diaria. Se cambia en Perfil &gt; Ajustes.</Text>
          <View style={{ height: space.lg }} />
          {GOALS.map((g) => (
            <Choice key={g.value} label={g.label} description={g.description} onPress={() => onFinish({ level, dailyGoalMin: g.value })} />
          ))}
        </View>
      )}
    </View>
  );
}

function Choice({ label, description, onPress }: { label: string; description: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${description}`}
      style={({ pressed }) => [styles.choice, pressed && { transform: [{ translateY: 2 }], borderBottomWidth: 2 }]}
    >
      <Text style={styles.choiceLabel}>{label}</Text>
      <Text style={styles.choiceText}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.lg, paddingBottom: space.xxl },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.xl },
  dots: { flexDirection: 'row', gap: space.sm },
  dot: { width: 28, height: 8, borderRadius: radius.bar, backgroundColor: colors.surfaceRaised },
  dotOn: { backgroundColor: colors.primary },
  skip: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted },
  body: { flex: 1 },
  emoji: { fontSize: 72, color: colors.primary, marginBottom: space.md },
  brand: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.gold, letterSpacing: 2, textTransform: 'uppercase', marginBottom: space.xs },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.text },
  text: { fontFamily: fonts.bold, fontSize: 15, color: colors.textMuted, marginTop: space.sm, lineHeight: 22 },
  choice: {
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    borderBottomWidth: 4,
    borderBottomColor: colors.surfaceShadow,
    paddingVertical: space.md,
    paddingHorizontal: 14,
    marginBottom: space.sm,
  },
  choiceLabel: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.text },
  choiceText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textMuted, marginTop: 2 },
});
