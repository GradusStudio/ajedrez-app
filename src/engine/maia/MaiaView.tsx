import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { WebView as WebViewBase, WebViewMessageEvent } from 'react-native-webview';
import { MaiaEngine } from './maiaEngine';
import { MaiaNetId } from './nets';
import { useMaiaHtml } from './useMaiaHtml';

// Mismo arreglo de tipos que EngineView (react-native-webview 14 con TypeScript 6).
const WebView = WebViewBase<object>;
type WebViewRef = WebViewBase<object>;

type Props = {
  /** Red de Maia: el nivel de juego humano que imita. */
  net: MaiaNetId;
  /** La red ya cargó y Maia puede evaluar posiciones. */
  onReady: (engine: MaiaEngine) => void;
  onError: (message: string) => void;
};

/** WebView invisible donde corre Maia. Al desmontarlo, el motor se cierra con él. */
export function MaiaView({ net, onReady, onError }: Props) {
  const [engine] = useState(() => new MaiaEngine());
  const html = useMaiaHtml(net, onError);

  useEffect(() => {
    engine.setOnFailure(onError);
    engine.setOnReady(() => onReady(engine));
  });

  useEffect(() => () => engine.close(), [engine]);

  // El reloj empieza cuando la página está lista: la descarga de la red (lenta con mala conexión) no cuenta.
  // Si la descarga falla, useMaiaHtml avisa con onError.
  useEffect(() => {
    if (html) engine.arm();
  }, [engine, html]);

  // Mientras la red carga no se monta nada.
  if (!html) return null;

  return (
    <WebView
      ref={(web: WebViewRef | null) =>
        engine.connect((json) => web?.injectJavaScript(`window.sendToMaia(${JSON.stringify(json)});true;`))
      }
      style={styles.hidden}
      originWhitelist={['https://localhost*']}
      source={{ html, baseUrl: 'https://localhost/' }}
      javaScriptEnabled
      onMessage={(e: WebViewMessageEvent) => engine.receive(e.nativeEvent.data)}
      onError={(e: { nativeEvent: { description: string } }) => engine.fail(e.nativeEvent.description)}
      // Android puede cerrar el proceso del WebView (por ejemplo, por falta de memoria).
      onRenderProcessGone={() => engine.fail('se cerró el motor')}
    />
  );
}

const styles = StyleSheet.create({
  hidden: { position: 'absolute', width: 1, height: 1, opacity: 0 },
});
