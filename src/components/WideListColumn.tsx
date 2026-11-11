import React from 'react';
import { ColumnContext } from './ColumnScrollView';
import { useWideLayout } from './useWideLayout';
import { WIDE_LIST_COLUMN } from './wideLayout';

/**
 * Ancho de la columna de una pantalla de lista en pantalla ancha. La pila usa 480 px por defecto; las pantallas
 * que se abren desde Perfil (Ajustes, Créditos, Piezas, Tableros) usan esta para no quedar como en el celular.
 * En el celular y en ventanas angostas el valor es null y no cambia nada.
 */
export function WideListColumn({ children, width = WIDE_LIST_COLUMN }: { children: React.ReactNode; width?: number }) {
  const wide = useWideLayout();
  return <ColumnContext.Provider value={wide ? width : null}>{children}</ColumnContext.Provider>;
}
