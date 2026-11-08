import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { WebView as WebViewBase, WebViewMessageEvent } from 'react-native-webview';
import { buildEngineHtml } from './engineHtml';
import { UciEngine } from './uci';

// Los tipos de react-native-webview 14 declaran `WebView<P = undefined>`, y con TypeScript 6
// `props & undefined` queda en `never`. Con P = object los tipos vuelven a funcionar.
const WebView = WebViewBase<object>;
type WebViewRef = WebViewBase<object>;

type Props = {
  /** El motor ya respondió `uciok` y `readyok`. */
  onReady: (engine: UciEngine) => void;
  onError: (message: string) => void;
};

// La página pesa ~2,4 MB (incluye el motor): se arma una sola vez.
let cachedHtml: string | null = null;
const engineHtml = () => (cachedHtml ??= buildEngineHtml());

/**
 * WebView invisible donde corre Stockfish. Montarlo en la pantalla que necesita el motor;
 * al desmontarlo, el motor se cierra con él.
 */
export function EngineView({ onReady, onError }: Props) {
  const [engine] = useState(() => new UciEngine());

  useEffect(() => {
    engine.setOnFailure(onError);
  });

  // Desde que se monta ya cuenta el tiempo: si la página nunca arranca, también se avisa.
  useEffect(() => {
    engine.arm();
    return () => engine.close();
  }, [engine]);

  return (
    <WebView
      // Cuando el WebView existe, el motor manda por él cada comando.
      ref={(web: WebViewRef | null) =>
        engine.connect((cmd) => web?.injectJavaScript(`window.sendToEngine(${JSON.stringify(cmd)});true;`))
      }
      // react-native-webview envuelve el WebView en un View con `flex: 1`: sin `containerStyle` ese
      // contenedor ocupa la mitad de la pantalla cuando comparte padre con otro `flex: 1`.
      containerStyle={styles.hidden}
      style={styles.hidden}
      originWhitelist={['https://localhost*']}
      source={{ html: engineHtml(), baseUrl: 'https://localhost/' }}
      javaScriptEnabled
      onMessage={(e: WebViewMessageEvent) => {
        const line = e.nativeEvent.data;
        if (line === 'host ready') {
          // Si falla, ya avisó `onFailure`.
          engine.init().then(
            () => onReady(engine),
            () => {}
          );
        } else {
          engine.receive(line);
        }
      }}
      onError={(e: { nativeEvent: { description: string } }) => engine.fail(e.nativeEvent.description)}
      // Android puede cerrar el proceso del WebView (por ejemplo, por falta de memoria).
      onRenderProcessGone={() => engine.fail('error: se cerró el motor')}
    />
  );
}

const styles = StyleSheet.create({
  hidden: { position: 'absolute', width: 1, height: 1, opacity: 0 },
});
