import { useEffect, type RefObject } from 'react';

/** Evita el menú del navegador y avisa con clic derecho o con Escape sobre el tablero. */
export function useContextMenu(ref: RefObject<unknown>, onContextMenu?: () => void): void {
  useEffect(() => {
    const node = ref.current as unknown as HTMLElement | null;
    if (!node || !onContextMenu) return;
    const menu = (e: MouseEvent) => {
      e.preventDefault();
      onContextMenu();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      onContextMenu();
    };
    node.addEventListener('contextmenu', menu);
    document.addEventListener('keydown', key);
    return () => {
      node.removeEventListener('contextmenu', menu);
      document.removeEventListener('keydown', key);
    };
  }, [ref, onContextMenu]);
}
