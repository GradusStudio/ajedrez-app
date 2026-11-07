// La oferta de instalar de la bienvenida de iPhone se muestra hasta que la persona elige seguir en el navegador,
// ya sea desde la bienvenida o desde /instalar. Vive en memoria: si recarga sin terminar la bienvenida, se ofrece otra vez.
let declined = false;

export const isInstallOfferDeclined = () => declined;
export const declineInstallOffer = () => {
  declined = true;
};
