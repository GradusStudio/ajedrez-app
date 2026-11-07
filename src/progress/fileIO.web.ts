export const FILE_IO_SUPPORTED = true;

/** Descarga `text` como archivo con un enlace `<a download>` temporal. */
export function saveTextFile(name: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // El navegador necesita un momento para empezar la descarga antes de soltar la URL.
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/** Abre el selector de archivos y devuelve el texto elegido, o `null` si el usuario cancela. */
export function pickTextFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.style.display = 'none';
    let done = false;
    const finish = (value: string | null) => {
      if (done) return;
      done = true;
      window.removeEventListener('focus', onFocus);
      input.remove();
      resolve(value);
    };
    // Navegadores sin el evento `cancel`: al volver el foco a la ventana sin archivo, se cancela.
    // Se espera un poco porque `change` llega después del foco.
    const onFocus = () => setTimeout(() => { if (!input.files?.length) finish(null); }, 1000);
    input.addEventListener('cancel', () => finish(null));
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return finish(null);
      file.text().then(finish, () => finish(null));
    });
    document.body.appendChild(input);
    window.addEventListener('focus', onFocus);
    input.click();
  });
}
