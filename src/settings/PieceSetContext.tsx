import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_PIECE_SET, PIECE_SET_META, PieceSetId } from '../pieces/pieceSets';
import { isPieceSetOwned } from '../pieces/shop';
import { useProgress } from '../progress/ProgressContext';

const STORAGE_KEY = '@ajedrez/pieceSet';

type Ctx = { pieceSet: PieceSetId; setPieceSet: (id: PieceSetId) => void; loaded: boolean };

// Sin Provider (por ejemplo en pruebas) se usa el set por defecto.
const PieceSetContext = createContext<Ctx>({ pieceSet: DEFAULT_PIECE_SET, setPieceSet: () => {}, loaded: true });

const isPieceSetId = (v: string | null): v is PieceSetId => !!v && PIECE_SET_META.some((m) => m.id === v);

/** Recuerda el set de piezas elegido en el perfil y lo comparte con toda la app. */
export function PieceSetProvider({ children }: { children: React.ReactNode }) {
  const [pieceSet, setState] = useState<PieceSetId>(DEFAULT_PIECE_SET);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (isPieceSetId(v)) setState(v);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const setPieceSet = useCallback((id: PieceSetId) => {
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
