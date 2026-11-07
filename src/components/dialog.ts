import { Alert } from 'react-native';

export type DialogButton = { text: string; style?: 'cancel' | 'destructive' | 'default'; onPress?: () => void };

/** Aviso o confirmación. En el teléfono es el `Alert` nativo; la web usa `dialog.web.ts`. */
export function showDialog(title: string, message: string, buttons?: DialogButton[]): void {
  Alert.alert(title, message, buttons);
}
