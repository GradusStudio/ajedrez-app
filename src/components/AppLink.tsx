import React from 'react';
import { Linking, Pressable, StyleProp, Text, TextStyle } from 'react-native';
import { router } from 'expo-router';
import { isSafeHref } from '../links';
import { appLinkBase } from './appLinkStyle';

type Props = {
  /** Dirección externa (https:, mailto:) o ruta interna de la app (/privacidad). */
  href: string;
  children: string;
  /** Se suma al aspecto común (appLinkStyle.ts): tamaño de letra y márgenes. */
  style?: StyleProp<TextStyle>;
};

// Enlace en el celular: abre el navegador o el correo, o navega dentro de la app. En la web lo reemplaza AppLink.web.tsx.
export function AppLink({ href, children, style }: Props) {
  if (!isSafeHref(href)) return null;
  const external = !href.startsWith('/');
  return (
    <Pressable
      onPress={() => (external ? Linking.openURL(href) : router.push(href as never))}
      accessibilityRole="link"
      hitSlop={6}
    >
      <Text style={[appLinkBase, style]}>{children}</Text>
    </Pressable>
  );
}
