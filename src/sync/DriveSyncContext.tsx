import React, { createContext, useContext } from 'react';
import { NOT_SUPPORTED, type DriveSyncValue } from './driveSyncTypes';

// En el celular no hay sincronización con Drive: ver DriveSyncContext.web.tsx.
const DriveSyncContext = createContext<DriveSyncValue>(NOT_SUPPORTED);

export function DriveSyncProvider({ children }: { children: React.ReactNode }) {
  return <DriveSyncContext.Provider value={NOT_SUPPORTED}>{children}</DriveSyncContext.Provider>;
}

export function useDriveSync(): DriveSyncValue {
  return useContext(DriveSyncContext);
}
