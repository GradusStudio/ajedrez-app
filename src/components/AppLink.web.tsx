import React from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { Link } from 'expo-router';

type Props = {
  /** Dirección externa (https:, mailto:) o ruta interna de la app (/privacidad). */
  href: string;
  children: string;
  style?: StyleProp<TextStyle>;
};

// En la web es un <a> de verdad: se puede abrir en otra pestaña, copiar y recorrer con el teclado.
// Las direcciones https: se abren en otra pestaña sin pasar la referencia de origen.
export function AppLink({ href, children, style }: Props) {
  const web = href.startsWith('https:');
  return (
    <Link href={href as never} style={style} {...(web ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {children}
    </Link>
  );
}
