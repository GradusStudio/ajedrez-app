import React from 'react';
import { Redirect } from 'expo-router';

// La importación de partidas vive en la pestaña Análisis (tarea 34): las rutas viejas llegan ahí.
export default function ImportGameRoute() {
  return <Redirect href="/analisis" />;
}
