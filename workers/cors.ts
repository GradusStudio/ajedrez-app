// CORS compartido por los Workers de Gradus: solo los orígenes de la app y del desarrollo local reciben permiso.

export const ALLOWED_ORIGINS = ['https://graduschess.com', 'http://localhost:8081', 'http://localhost:8788'];

export function corsHeaders(req: Request, methods: string): Record<string, string> {
  const origin = req.headers.get('Origin');
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (origin && ALLOWED_ORIGINS.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}
