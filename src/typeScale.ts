// Escala de letra base (celular y web angosta). La web ancha usa typeScale.web.ts.
// Feedback del primer tester (14-11-2026), sección 1 de
// docs/superpowers/specs/2026-11-14-feedback-tester-design.md.
export const type = {
  caption: 12, // rótulos chicos (hoy 11-12; la barra de pestañas del celular conserva 11)
  secondary: 14, // secundario (hoy 13-14)
  body: 15, // texto de lectura (hoy 14-15)
  button: 14, // botones (Button3D); en la web ancha, 16
  title: 24, // títulos de pantalla
  display: 40, // números grandes (monedas, racha)
} as const;

export type TypeRole = keyof typeof type;
