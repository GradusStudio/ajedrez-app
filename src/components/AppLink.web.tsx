import React from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { Link } from 'expo-router';
import { appLinkBase } from './appLinkStyle';

type Props = {
  /** Dirección externa (https:, mailto:) o ruta interna de la app (/privacidad). */
  href: string;
  children: string;
  /** Se suma al aspecto común (appLinkStyle.ts): tamaño de letra y márgenes. */
  style?: StyleProp<TextStyle>;
};

/** En la web `textAlignVertical` no existe: el texto se centra en los 44 px como un contenedor flex, del ancho del texto. */
const webCentered: TextStyle = { display: 'flex', alignItems: 'center', alignSelf: 'flex-start' };

// En la web es un <a> de verdad: se puede abrir en otra pestaña, copiar y recorrer con el teclado.
// Las direcciones https: se abren en otra pestaña sin pasar la referencia de origen.
export function AppLink({ href, children, style }: Props) {
  const web = href.startsWith('https:');
  return (
    <Link href={href as never} style={[appLinkBase, webCentered, style]} {...(web ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {children}
    </Link>
  );
}
