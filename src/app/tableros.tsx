import React from 'react';
import { Redirect } from 'expo-router';

/** Ruta vieja: ahora la tienda es una sola en /tienda. */
export default function BoardsRoute() {
  return <Redirect href={{ pathname: '/tienda', params: { tab: 'tableros' } }} />;
}
