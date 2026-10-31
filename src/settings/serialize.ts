// Cola de tareas asíncronas: cada tarea empieza cuando termina la anterior (sin React Native).

export function createSerializer() {
  let tail: Promise<unknown> = Promise.resolve();
  return function run<T>(task: () => Promise<T>): Promise<T> {
    const result = tail.then(task);
    // La cola sigue aunque la tarea falle; quien la pidió igual recibe su error en `result`.
    tail = result.catch(() => {});
    return result;
  };
}
