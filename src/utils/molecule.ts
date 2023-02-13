import { RDKitModule } from '@rdkit/rdkit';
import { get_molecule } from '@iktos-oss/rdkit-provider';

export const get_molecule_details = (
  smiles: string,
  RDKit: RDKitModule,
): { numAtoms: number; numRings: number } | null => {
  const mol = get_molecule(smiles, RDKit);
  if (!mol) return null;

  const details = JSON.parse(mol.get_descriptors());
  if (!globalThis.rdkitProviderGlobals.jsMolCacheEnabled) {
    mol.delete();
  }
  return {
    numAtoms: details.NumHeavyAtoms,
    numRings: details.NumRings,
  };
};

export const is_valid_smiles = (smiles: string, RDKit: RDKitModule): boolean => {
  if (!smiles) return false;
  const mol = get_molecule(smiles, RDKit);
  if (!mol) return false;
  const isValid = mol.is_valid();
  if (!globalThis.rdkitProviderGlobals.jsMolCacheEnabled) {
    mol.delete();
  }
  return isValid;
};

export const get_canonical_form_for_structure = (structure: string, RDKit: RDKitModule): string | null => {
  if (is_valid_smiles(structure, RDKit)) return get_canonical_smiles(structure, RDKit);
  const mol = get_molecule(structure, RDKit);
  if (!mol) return null;
  const cannonicalForm = mol.get_smarts();
  if (!globalThis.rdkitProviderGlobals.jsMolCacheEnabled) {
    mol.delete();
  }
  return cannonicalForm;
};

const get_canonical_smiles = (smiles: string, RDKit: RDKitModule): string | null => {
  const mol = get_molecule(smiles, RDKit);
  if (!mol) return null;
  const cannonicalSmiles = mol.get_smiles();
  if (!globalThis.rdkitProviderGlobals.jsMolCacheEnabled) {
    mol.delete();
  }
  return cannonicalSmiles;
};
