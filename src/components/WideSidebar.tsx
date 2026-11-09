import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Tabs } from 'expo-router/js-tabs';
import { colors, fonts, radius, space } from '../theme';

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

/**
 * Barra lateral de la web en pantalla ancha: las mismas 6 pestañas, a la izquierda, con el ícono de Gradus arriba.
 * `labels` en false (ventana de 960 a 1199 px) muestra solo los íconos para dejarle lugar al tablero.
 * Diseño: docs/superpowers/specs/2026-11-08-web-pantalla-ancha-design.md.
 */
export function WideSidebar({ state, descriptors, emitter, navigateToTab, labels }: TabBarProps & { labels: boolean }) {
  return (
    <View style={[styles.side, labels ? styles.sideWide : styles.sideCompact]}>
      <View style={[styles.brand, !labels && styles.brandCompact]}>
        <Image source={require('../../assets/icon.png')} style={styles.logo} accessibilityIgnoresInvertColors />
        {labels && <Text style={styles.brandText}>Gradus</Text>}
      </View>
      <View accessibilityRole="tablist" style={styles.list}>
        {state.routes.map((route, i) => {
          const { options } = descriptors[route.key];
          const focused = state.index === i;
          const label = typeof options.title === 'string' ? options.title : route.name;
          const color = focused ? colors.primary : colors.textMuted;
          const onPress = () => {
            const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigateToTab(route.key);
          };
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              // En la web, Pressable también informa `hovered` y `focused` (teclado): fondo al pasar y anillo dorado.
              style={(s) => {
                const { hovered, focused: keyboard } = s as typeof s & { hovered?: boolean; focused?: boolean };
                return [
                  styles.item,
                  !labels && styles.itemCompact,
                  hovered && !focused && styles.itemHover,
                  focused && styles.itemOn,
                  keyboard && styles.itemFocus,
                ];
              }}
            >
              {options.tabBarIcon?.({ focused, color, size: 24 })}
              {labels && (
                <Text numberOfLines={1} style={[styles.label, { color }]}>
                  {label}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  side: {
    height: '100%',
    backgroundColor: colors.surface,
    borderRightWidth: 2,
    borderRightColor: colors.surfaceRaised,
    paddingTop: space.xl,
    paddingHorizontal: space.md,
  },
  sideWide: { width: 232 },
  sideCompact: { width: 76, paddingHorizontal: space.sm },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: space.sm, marginBottom: space.xl },
  brandCompact: { justifyContent: 'center', paddingHorizontal: 0 },
  logo: { width: 36, height: 36, borderRadius: 10 },
  brandText: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.text },
  list: { gap: space.xs },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 48,
    paddingHorizontal: space.md,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  itemCompact: { justifyContent: 'center', paddingHorizontal: 0 },
  itemHover: { backgroundColor: colors.surfaceShadow },
  itemOn: { backgroundColor: colors.surfaceRaised, borderColor: colors.surfaceRaised },
  itemFocus: { borderColor: colors.gold },
  label: { fontFamily: fonts.extrabold, fontSize: 15 },
});
