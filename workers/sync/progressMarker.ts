// Reconoce un archivo de progreso de Gradus sin importar módulos de la app (progressFile.ts usa AsyncStorage y no corre
// en el Worker). Refleja solo las marcas de `progressToFile`: { app: 'gradus', kind: 'progress', progress: { version } }.
// El servidor no valida el resto: solo evita que cualquiera use el espacio para guardar texto ajeno.

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

export function isProgressFile(text: string): boolean {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return false;
  }
  if (!isObject(data) || data.app !== 'gradus' || data.kind !== 'progress' || !isObject(data.progress)) return false;
  const v = data.progress.version;
  return typeof v === 'number' && Number.isInteger(v) && v >= 1;
}
