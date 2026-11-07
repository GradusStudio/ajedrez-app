// El navegador prohíbe cambiar el User-Agent y Lichess y chess.com responden bien igual.
export function fetchHeaders(accept: string): Record<string, string> {
  return { Accept: accept };
}
