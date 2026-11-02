import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { WebView as WebViewBase, WebViewMessageEvent } from 'react-native-webview';
import { buildMaiaHtml } from './maiaHtml';
import { MaiaEngine } from './maiaEngine';
import { MaiaNetId, netBase64 } from './nets';

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

// La página lleva la red adentro (~1,8 MB): se arma una vez por red.
const cache = new Map<MaiaNetId, string>();
const htmlFor = (net: MaiaNetId) => {
  let html = cache.get(net);
  if (!html) {
    html = buildMaiaHtml(netBase64(net));
    cache.set(net, html);
  }
  return html;
};

/** WebView invisible donde corre Maia. Al desmontarlo, el motor se cierra con él. */
export function MaiaView({ net, onReady, onError }: Props) {
  const [engine] = useState(() => new MaiaEngine());

  useEffect(() => {
    engine.setOnFailure(onError);
    engine.setOnReady(() => onReady(engine));
  });

  // Desde que se monta ya cuenta el tiempo: si la página nunca arranca, también se avisa.
  useEffect(() => {
    engine.arm();
    return () => engine.close();
  }, [engine]);

  return (
    <WebView
      ref={(web: WebViewRef | null) =>
        engine.connect((json) => web?.injectJavaScript(`window.sendToMaia(${JSON.stringify(json)});true;`))
      }
      style={styles.hidden}
      originWhitelist={['*']}
      source={{ html: htmlFor(net), baseUrl: 'https://localhost/' }}
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
