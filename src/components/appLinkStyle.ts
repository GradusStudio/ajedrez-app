import type { TextStyle } from 'react-native';
import { colors, fonts } from '../theme';

/** Aspecto común de los enlaces (AppLink): verde, en negrita, subrayado y con 44 px de alto para tocarlo cómodo. */
export const appLinkBase: TextStyle = {
  fontFamily: fonts.bold,
  color: colors.primary,
  textDecorationLine: 'underline',
  minHeight: 44,
  textAlignVertical: 'center',
};
