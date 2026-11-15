import React, { useEffect, useRef } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Tabs } from 'expo-router/js-tabs';
import { router, usePathname } from 'expo-router';
import { BotAvatar } from './BotAvatar';
import { StatIcon } from './StatIcon';
import { TabIcon } from './TabIcon';
import { setTabBarTarget } from './tabBarTarget';
import { useContent } from '../data/useContent';
import { useI18n } from '../i18n/I18nContext';
import { currentStreak } from '../progress/progressStore';
import { useProgress } from '../progress/ProgressContext';
import { useTodayKey } from '../settings/useTodayKey';
import { type, colors, fonts, radius, space } from '../theme';
import { SIDEBAR_ICON_WIDTH, SIDEBAR_WIDTH } from './wideLayout';

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

/**
 * Barra lateral de la web en pantalla ancha: las secciones de siempre arriba y, abajo, la tienda con el saldo
 * y el perfil con el avatar y la racha (spec de la tienda y la barra, sección 1). `labels` en false (ventana de
 * 960 a 1199 px) muestra solo los íconos para dejarle lugar al tablero. Diseño:
 * docs/superpowers/specs/2026-11-14-tienda-y-barra-design.md.
 */
export function WideSidebar({ state, descriptors, emitter, navigateToTab, labels }: TabBarProps & { labels: boolean }) {
  const pathname = usePathname();
  const { progress } = useProgress();
  const { t, tn, number } = useI18n();
  const { bots } = useContent();
  const today = useTodayKey();
  const streak = currentStreak(progress, today);
  const pipo = bots.find((b) => b.id === 'pipo') ?? bots[0];
  // El consejo de las pestañas ilumina esta barra (ver tabBarTarget.ts).
  const barRef = useRef<React.ComponentRef<typeof View>>(null);
  useEffect(() => {
    setTabBarTarget(barRef);
    return () => setTabBarTarget(null);
  }, []);

  const goToTab = (route: (typeof state.routes)[number], i: number) => {
    const focused = state.index === i;
    const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!focused && !event.defaultPrevented) navigateToTab(route.key);
  };

  // En la web, Pressable también informa `hovered` y `focused` (teclado): fondo al pasar y anillo dorado.
  const itemStyle = (active: boolean) => (s: object) => {
    const { hovered, focused: keyboard } = s as { hovered?: boolean; focused?: boolean };
    return [
      styles.item,
      !labels && styles.itemCompact,
      hovered && !active && styles.itemHover,
      active && styles.itemOn,
      keyboard && styles.itemFocus,
    ];
  };

  const renderTab = (route: (typeof state.routes)[number], i: number) => {
    const { options } = descriptors[route.key];
    const focused = state.index === i;
    const label = typeof options.title === 'string' ? options.title : route.name;
    const color = focused ? colors.primary : colors.textMuted;
    return (
      <Pressable
        key={route.key}
        onPress={() => goToTab(route, i)}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={label}
        style={itemStyle(focused)}
      >
        {options.tabBarIcon?.({ focused, color, size: 24 })}
        {labels && (
          <Text numberOfLines={1} style={[styles.label, { color }]}>
            {label}
          </Text>
        )}
      </Pressable>
    );
  };

  const profileIndex = state.routes.findIndex((r) => r.name === 'perfil');
  const profileRoute = profileIndex >= 0 ? state.routes[profileIndex] : null;
  const profileOptions = profileRoute ? descriptors[profileRoute.key].options : null;
  const profileFocused = profileIndex === state.index;
  const profileLabel = profileOptions && typeof profileOptions.title === 'string' ? profileOptions.title : t('tabs.profile');
  const shopFocused = pathname === '/tienda';

  return (
    <View ref={barRef} role="navigation" style={[styles.side, labels ? styles.sideWide : styles.sideCompact]}>
      <View style={[styles.brand, !labels && styles.brandCompact]}>
        <Image source={require('../../assets/icon.png')} style={styles.logo} accessibilityIgnoresInvertColors />
        {labels && <Text style={styles.brandText}>Gradus</Text>}
      </View>
      <View accessibilityRole="tablist" style={styles.list}>
        {state.routes.map((route, i) => (route.name === 'perfil' ? null : renderTab(route, i)))}
      </View>
      <View style={styles.separator} />
      <View style={styles.bottom}>
        <Pressable
          onPress={() => router.push('/tienda')}
          accessibilityRole="button"
          accessibilityLabel={t('nav.shop')}
          style={itemStyle(shopFocused)}
        >
          <TabIcon name="shop" color={shopFocused ? colors.primary : colors.textMuted} />
          {labels && (
            <Text numberOfLines={1} style={[styles.label, { color: shopFocused ? colors.primary : colors.textMuted, flex: 1 }]}>
              {t('nav.shop')}
            </Text>
          )}
          {labels && (
            <View style={styles.coins}>
              <StatIcon name="coin" size={18} />
              <Text style={styles.coinsText}>{number(progress.coins)}</Text>
            </View>
          )}
        </Pressable>
        {profileRoute && (
          <Pressable
            onPress={() => goToTab(profileRoute, profileIndex)}
            accessibilityRole="tab"
            accessibilityState={{ selected: profileFocused }}
            accessibilityLabel={profileLabel}
            style={(s) => {
              const { hovered, focused: keyboard } = s as { hovered?: boolean; focused?: boolean };
              return [
                styles.profileRow,
                !labels && styles.profileCompact,
                hovered && !profileFocused && styles.itemHover,
                profileFocused && styles.itemOn,
                keyboard && styles.itemFocus,
              ];
            }}
          >
            <View style={styles.avatarRing}>{pipo && <BotAvatar bot={pipo} size={40} expression="acierto" />}</View>
            {labels && (
              <View style={styles.profileText}>
                <Text style={styles.profileName}>{profileLabel}</Text>
                <Text style={styles.profileStreak}>{tn('nav.profileStreak', streak)}</Text>
              </View>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  side: {
    height: '100%',
    // Deja ver la luz del fondo (spec del fondo, sección 1).
    backgroundColor: 'rgba(20, 19, 17, 0.45)',
    borderRightWidth: 2,
    borderRightColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: space.xl,
    paddingHorizontal: space.md,
  },
  sideWide: { width: SIDEBAR_WIDTH },
  sideCompact: { width: SIDEBAR_ICON_WIDTH, paddingHorizontal: space.sm },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: space.sm, marginBottom: space.xl },
  brandCompact: { justifyContent: 'center', paddingHorizontal: 0 },
  logo: { width: 36, height: 36, borderRadius: 10 },
  brandText: { fontFamily: fonts.extrabold, fontSize: type.title, color: colors.text },
  list: { flex: 1, gap: space.xs },
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
  label: { fontFamily: fonts.extrabold, fontSize: type.body },
  separator: { height: 2, backgroundColor: 'rgba(255, 255, 255, 0.06)', marginVertical: space.sm, marginHorizontal: space.xs },
  bottom: { gap: space.xs, paddingBottom: space.md },
  coins: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  coinsText: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.gold },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 60,
    paddingHorizontal: space.md,
    borderRadius: radius.control,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  profileCompact: { justifyContent: 'center', paddingHorizontal: 0 },
  avatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: { flex: 1 },
  profileName: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.text },
  profileStreak: { fontFamily: fonts.bold, fontSize: type.caption, color: colors.textMuted, marginTop: 1 },
});
