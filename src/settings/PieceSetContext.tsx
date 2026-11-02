import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnyPieceSetId, isAnyPieceSetId } from '../pieces/materials';
import { DEFAULT_PIECE_SET } from '../pieces/pieceSets';
import { isPieceSetOwned } from '../pieces/shop';
import { useProgress } from '../progress/ProgressContext';

const STORAGE_KEY = '@ajedrez/pieceSet';

type Ctx = { pieceSet: AnyPieceSetId; setPieceSet: (id: AnyPieceSetId) => void; loaded: boolean };

// Sin Provider (por ejemplo en pruebas) se usa el set por defecto.
const PieceSetContext = createContext<Ctx>({ pieceSet: DEFAULT_PIECE_SET, setPieceSet: () => {}, loaded: true });

/** Recuerda el set de piezas elegido en el perfil y lo comparte con toda la app. */
export function PieceSetProvider({ children }: { children: React.ReactNode }) {
  const [pieceSet, setState] = useState<AnyPieceSetId>(DEFAULT_PIECE_SET);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (isAnyPieceSetId(v)) setState(v);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const setPieceSet = useCallback((id: AnyPieceSetId) => {
    setState(id);
    AsyncStorage.setItem(STORAGE_KEY, id).catch(() => {});
  }, []);

  // Un set de pago que ya no se tiene (por ejemplo, tras borrar el progreso) vuelve al set por defecto.
  const bought = useProgress().progress.pieceSets;
  const inUse = isPieceSetOwned(pieceSet, bought) ? pieceSet : DEFAULT_PIECE_SET;

  const value = useMemo(() => ({ pieceSet: inUse, setPieceSet, loaded }), [inUse, setPieceSet, loaded]);
  return <PieceSetContext.Provider value={value}>{children}</PieceSetContext.Provider>;
}

export const usePieceSet = () => useContext(PieceSetContext);
