import React from 'react';
import { ScreenError } from './ScreenError';
import { shouldReloadForChunk } from '../pwa/chunkError';
import { reloadOnceForChunk, reloadPage } from '../pwa/reloadOnce';

type Props = { children: React.ReactNode };
type State = { error: unknown; tried: boolean };

/**
 * Límite de errores de las pantallas (tarea 33): si una pantalla falla al dibujarse, en lugar de dejar la app en
 * blanco muestra el aviso de ScreenError con «Volver a intentar» y, en la web, «Recargar la app». Si el error es de
 * carga de un trozo de código (la app quedó con una versión vieja en caché), recarga la página una sola vez para
 * tomar la versión publicada.
 */
export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, tried: false };

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return { error };
  }

  componentDidCatch(error: unknown) {
    if (shouldReloadForChunk(error, this.state.tried)) {
      this.setState({ tried: true });
      reloadOnceForChunk();
    }
  }

  retry = () => this.setState({ error: null });

  render() {
    if (this.state.error == null) return this.props.children;
    return <ScreenError onRetry={this.retry} onReload={reloadPage} />;
  }
}
