// Datos públicos de la conexión con Google. El ID de cliente de OAuth no es un secreto (va en cualquier página que
// use «Continuar con Google»); el «secreto del cliente» no se usa y no debe aparecer en el código.
// Proyecto de Google Cloud «graduschessapp», cliente de tipo «Aplicación web» con origen https://graduschess.com.

export const GOOGLE_CLIENT_ID = '509168871162-0g6pidmqa5o3jusq4vr8pg8i252cdtm3.apps.googleusercontent.com';

/** Solo la carpeta oculta de la app en el Drive de la persona. No pide correo, perfil ni el resto de sus archivos. */
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
