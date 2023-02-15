import { get_molecule, release_molecule } from '@iktos-oss/rdkit-provider';
import { JSMol, RDKitModule } from '@rdkit/rdkit';
import { AlignmentDetails } from '../components';
import { HIGHLIGHT_RDKIT_COLORS, RDKitColor, TRANSPARANT_RDKIT_COLOR } from '../constants';
import { get_canonical_form_for_structure, get_molecule_details } from './molecule';

export const get_svg = (params: DrawSmilesSVGProps, RDKit: RDKitModule) => {
  if (!params.smiles) return null;
  const canonicalSmiles = get_canonical_form_for_structure(params.smiles, RDKit);
  if (!canonicalSmiles) return null;

  const {
    width,
    height,
    details = {},
    atomsToHighlight,
    bondsToHighlight,
    isClickable,
    clickableAtoms,
    alignmentDetails,
  } = params;
  const highlightBondColors = getHighlightColors(bondsToHighlight);
  const highlightAtomColors = getHighlightColors(atomsToHighlight);
  const moleculeDetails = isClickable ? get_molecule_details(canonicalSmiles, RDKit) : null;
  if (isClickable && moleculeDetails) {
    setHighlightColorForClickableMolecule({
      nbAtoms: moleculeDetails.numAtoms,
      clickableAtoms,
      atomsToHighlight,
      highlightAtomColors,
    });
  }
  const atomsToDrawWithHighlight =
    isClickable && moleculeDetails ? [...Array(moleculeDetails.numAtoms).keys()] : atomsToHighlight?.flat() ?? [];
  const bondsToDrawWithHighlight = bondsToHighlight?.flat() ?? [];

  let mol = null;
  try {
    mol = get_molecule(canonicalSmiles, RDKit);
    if (!mol) return null;
    if (alignmentDetails) {
      addAlignmentFromMolBlock({
        mol,
        alignmentDetails,
        highlightAtomColors,
        atomsToDrawWithHighlight,
        highlightBondColors,
        bondsToDrawWithHighlight,
        RDKit,
      });
    }
    const rdkitDrawingOptions = JSON.stringify({
      ...DEFAULT_DRAWING_DETAILS,
      ...details,
      width,
      height,
      atoms: atomsToDrawWithHighlight,
      bonds: bondsToDrawWithHighlight,
      highlightAtomColors,
      highlightBondColors,
    });
    const svg = mol.get_svg_with_highlights(rdkitDrawingOptions);
    return svg;
  } catch (error) {
    console.error(error);
    return null;
  } finally {
    if (mol) {
      if (alignmentDetails) {
        // reset coords as mol could be in cache
        mol.set_new_coords();
      }
      release_molecule(mol);
    }
  }
};

export const get_svg_from_smarts = (params: DrawSmartsSVGProps, RDKit: RDKitModule): string | null => {
  if (!RDKit) return null;
  if (!params.smarts) return null;

  const canonicalSmarts = get_canonical_form_for_structure(params.smarts, RDKit);
  if (!canonicalSmarts) return null;

  const smartsMol = RDKit.get_qmol(canonicalSmarts);
  const svg = smartsMol.get_svg(params.width, params.height);
  smartsMol.delete();
  return svg;
};

const getHighlightColors = (items?: number[][]) => {
  // give each array of atoms a color, enabling multi-color highlights
  const highlightColors: HighlightColors = {};
  let cpt = 0;
  const limit = HIGHLIGHT_RDKIT_COLORS.length;
  for (const item of items ?? []) {
    const color = HIGHLIGHT_RDKIT_COLORS[cpt++ % limit];
    if (!item) continue;
    for (const atomIdx of item) {
      highlightColors[atomIdx] = color;
    }
  }
  return highlightColors;
};

const addAlignmentFromMolBlock = ({
  mol,
  alignmentDetails,
  highlightAtomColors,
  atomsToDrawWithHighlight,
  highlightBondColors,
  bondsToDrawWithHighlight,
  RDKit,
}: {
  mol: JSMol;
  alignmentDetails: AlignmentDetails;
  highlightAtomColors: HighlightColors;
  highlightBondColors: HighlightColors;
  atomsToDrawWithHighlight: number[];
  bondsToDrawWithHighlight: number[];
  RDKit: RDKitModule;
}) => {
  const molToAlignWith = get_molecule(alignmentDetails.molBlock, RDKit);
  if (!molToAlignWith) return;
  mol.generate_aligned_coords(molToAlignWith, true);
  if (!alignmentDetails.highlightColor) {
    release_molecule(molToAlignWith);
    return;
  }
  const { atoms: molblockAtomsToHighlight, bonds: molblockBondsToHighlight } = JSON.parse(
    mol.get_substruct_match(molToAlignWith),
  );
  if (molblockAtomsToHighlight) {
    addAtomsOrBondsToHighlight({
      indicies: molblockAtomsToHighlight,
      highlightColors: highlightAtomColors,
      indiciesToHighlight: atomsToDrawWithHighlight,
      color: alignmentDetails.highlightColor,
    });
  }
  if (molblockBondsToHighlight) {
    addAtomsOrBondsToHighlight({
      indicies: molblockBondsToHighlight,
      highlightColors: highlightBondColors,
      indiciesToHighlight: bondsToDrawWithHighlight,
      color: alignmentDetails.highlightColor,
    });
  }
  release_molecule(molToAlignWith);
};

const addAtomsOrBondsToHighlight = ({
  indicies,
  indiciesToHighlight,
  highlightColors,
  color = HIGHLIGHT_RDKIT_COLORS[0],
}: {
  indicies: number[];
  highlightColors: HighlightColors;
  indiciesToHighlight: number[];
  color?: RDKitColor;
}) => {
  for (const idx of indicies) {
    highlightColors[idx] = color;
    if (!indiciesToHighlight.includes(idx)) {
      indiciesToHighlight.push(idx);
    }
  }
};

const setHighlightColorForClickableMolecule = ({
  nbAtoms,
  clickableAtoms,
  atomsToHighlight,
  highlightAtomColors,
}: {
  nbAtoms: number;
  clickableAtoms?: ClickableAtoms;
  atomsToHighlight?: number[][];
  highlightAtomColors: HighlightColors;
}) => {
  const clickableAtomsBackgroundColor = clickableAtoms?.clickableAtomsBackgroundColor ?? TRANSPARANT_RDKIT_COLOR;
  const clickableAtomIds = clickableAtoms?.clickableAtomsIds ?? [...Array(nbAtoms).keys()];
  for (let i = 0; i < nbAtoms; i++) {
    if (atomsToHighlight?.flat().includes(i)) continue;
    if (clickableAtomIds.includes(i)) {
      highlightAtomColors[i] = clickableAtomsBackgroundColor;
    } else {
      highlightAtomColors[i] = TRANSPARANT_RDKIT_COLOR;
    }
  }
};

const DEFAULT_DRAWING_DETAILS = {
  bondLineWidth: 1,
  backgroundColour: [1, 1, 1, 0],
  highlightColour: HIGHLIGHT_RDKIT_COLORS[0],
  highlightRadius: 0.3,
  fixedBondLength: 50,
};

export interface DrawSmilesSVGProps {
  smiles: string;
  width: number;
  height: number;
  details?: Record<string, unknown>;
  alignmentDetails?: AlignmentDetails;
  atomsToHighlight?: number[][];
  bondsToHighlight?: number[][];
  isClickable?: boolean;
  clickableAtoms?: ClickableAtoms;
}

export interface ClickableAtoms {
  clickableAtomsIds: number[];
  clickableAtomsBackgroundColor?: RDKitColor;
}

interface DrawSmartsSVGProps {
  smarts: string;
  width: number;
  height: number;
}

type HighlightColors = Record<number, RDKitColor>;
