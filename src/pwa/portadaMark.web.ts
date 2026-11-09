// Marca que deja la portada (sitio/portada.js) al jugar e4: la bienvenida salta directo a elegir el nivel.
const MARK = 'gradus:portada-peon';

export const playedOnPortada = (): boolean => {
  try {
    return localStorage.getItem(MARK) === '1';
  } catch {
    return false;
  }
};
