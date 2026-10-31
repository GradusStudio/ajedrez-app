/** Reemplaza los marcadores `{n}` de un texto por sus valores. Un marcador sin valor queda como está. */
export function format(template: string, values?: Record<string, string | number>): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m));
}
