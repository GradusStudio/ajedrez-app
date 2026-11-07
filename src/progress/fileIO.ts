// Guardar y cargar archivos de texto: solo en la web (fileIO.web.ts). En el teléfono el progreso vive en el aparato.

export const FILE_IO_SUPPORTED = false;

export function saveTextFile(_name: string, _text: string): void {
  throw new Error('saveTextFile: solo disponible en la web');
}

export async function pickTextFile(): Promise<string | null> {
  return null;
}
