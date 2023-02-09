import { JSMol } from '@rdkit/rdkit';
import { MAX_CACHED_JSMOLS } from '../constants';

export const storeJSMolInCache = (smiles: string, mol: JSMol) => {
  const nbCachedMolecules = Object.keys(globalThis.jsMolCache ?? {}).length;
  if (!globalThis.jsMolCache || nbCachedMolecules > MAX_CACHED_JSMOLS) {
    cleanJSMolCache();
    globalThis.jsMolCache = { [smiles]: mol };
    return;
  }
  globalThis.jsMolCache[smiles] = mol;
};

export const getJSMolFromCache = (smiles: string) => {
  if (!globalThis.jsMolCache) {
    return null;
  }
  return globalThis.jsMolCache[smiles];
};

export const cleanJSMolCache = () => {
  if (!globalThis.jsMolCache) return;
  for (const [smiles, mol] of Object.entries(globalThis.jsMolCache)) {
    mol.delete();
    delete globalThis.jsMolCache[smiles];
  }
};
