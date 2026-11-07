export type DialogButton = { text: string; style?: 'cancel' | 'destructive' | 'default'; onPress?: () => void };

/**
 * Aviso o confirmación en la web: `Alert.alert` de react-native-web no hace nada.
 * Sin botones o con uno, `window.alert` y después su acción. Con dos, `window.confirm`:
 * aceptar llama al botón que no es `cancel`, cancelar al que sí lo es.
 */
export function showDialog(title: string, message: string, buttons: DialogButton[] = []): void {
  if (buttons.length > 2) throw new Error('showDialog: en la web solo se admiten hasta dos botones');
  const text = `${title}\n\n${message}`;
  if (buttons.length < 2) {
    window.alert(text);
    buttons[0]?.onPress?.();
    return;
  }
  const cancel = buttons.find((b) => b.style === 'cancel');
  const action = buttons.find((b) => b !== cancel) as DialogButton;
  (window.confirm(text) ? action : cancel)?.onPress?.();
}
