import { RDKitModule } from '@rdkit/rdkit';
import React, { PropsWithChildren, useEffect, useState } from 'react';

export interface RDKitContextValue {
  RDKit: RDKitModule | null;
}

// force default context to be undefined, to check if package users have wrapped it with the required provider
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const RDKitContext = React.createContext<RDKitContextValue>(undefined as any);

export const RDKitProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [RDKit, setRDKit] = useState<RDKitModule | null>(null);

  useEffect(() => {
    if (globalThis.initRDKitModule) {
      globalThis.initRDKitModule().then((loadedRDKit) => {
        setRDKit(loadedRDKit);
      });
    }
  }, []);

  return <RDKitContext.Provider value={{ RDKit }}>{children}</RDKitContext.Provider>;
};
