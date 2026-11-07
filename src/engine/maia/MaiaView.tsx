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

  // Desde que se monta ya cuenta el tiempo: si la página nunca arranca, también se avisa.
  useEffect(() => {
    engine.arm();
    return () => engine.close();
  }, [engine]);

  // Mientras la red carga no se monta nada; el reloj de arm() ya corre.
  if (!html) return null;

  return (
    <WebView
      ref={(web: WebViewRef | null) =>
        engine.connect((json) => web?.injectJavaScript(`window.sendToMaia(${JSON.stringify(json)});true;`))
      }
      style={styles.hidden}
      originWhitelist={['*']}
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
