// Lichess responde 404 a los clientes con User-Agent genérico (curl, okhttp, el de React Native en Android)
// y chess.com responde 403 si no hay ninguno: en el teléfono se manda uno propio e identificable.
// En el navegador no se puede cambiar el User-Agent: ver userAgent.web.ts.
const USER_AGENT = 'Gradus-Chess-App/1.0';

export function fetchHeaders(accept: string): Record<string, string> {
  return { Accept: accept, 'User-Agent': USER_AGENT };
}
