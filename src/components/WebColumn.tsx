import React from 'react';

// En el celular la app ocupa toda la pantalla: no hay nada que envolver. La versión web es WebColumn.web.tsx.
export function WebColumn({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
