import { getSvgFromSmarts } from '@iktos-oss/rdkit-provider';
import {
  getSvg,
  getMoleculeDetails,
  getCanonicalFormForStructure,
  getMatchingSubstructure,
} from '@iktos-oss/rdkit-provider';
import { AlignmentDetails } from '../components';
import { HIGHLIGHT_RDKIT_COLORS, RDKitColor, TRANSPARANT_RDKIT_COLOR } from '../constants';

export const get_svg = async (params: DrawSmilesSVGProps, worker: Worker) => {
  if (!params.smiles) return null;
  const { canonicalForm: canonicalSmiles } = await getCanonicalFormForStructure(worker, {
    structure: params.smiles,
  });
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
  const moleculeDetails = isClickable ? await getMoleculeDetails(worker, { smiles: canonicalSmiles }) : null;
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

  try {
    if (alignmentDetails) {
      await addAlignmentFromMolBlock({
        smiles: canonicalSmiles,
        alignmentDetails,
        highlightAtomColors,
        atomsToDrawWithHighlight,
        highlightBondColors,
        bondsToDrawWithHighlight,
        worker,
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
    const { svg } = await getSvg(worker, {
      smiles: canonicalSmiles,
      drawingDetails: rdkitDrawingOptions,
      alignmentDetails,
    });
    return svg;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const get_svg_from_smarts = async (params: DrawSmartsSVGProps, worker: Worker) => {
  if (!worker) return null;
  if (!params.smarts) return null;

  const { canonicalForm: canonicalSmarts } = await getCanonicalFormForStructure(worker, {
    structure: params.smarts,
  });
  if (!canonicalSmarts) return null;

  const { svg } = await getSvgFromSmarts(worker, {
    ...params,
    smarts: canonicalSmarts,
  });
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

const addAlignmentFromMolBlock = async ({
  smiles,
  alignmentDetails,
  highlightAtomColors,
  atomsToDrawWithHighlight,
  highlightBondColors,
  bondsToDrawWithHighlight,
  worker,
}: {
  smiles: string;
  alignmentDetails: AlignmentDetails;
  highlightAtomColors: HighlightColors;
  highlightBondColors: HighlightColors;
  atomsToDrawWithHighlight: number[];
  bondsToDrawWithHighlight: number[];
  worker: Worker;
}) => {
  if (!alignmentDetails.highlightColor) {
    return;
  }
  const matchDetails = await getMatchingSubstructure(worker, {
    structure: smiles,
    substructure: alignmentDetails.molBlock,
  });
  if (!matchDetails) return;
  const { matchingAtoms, matchingBonds } = matchDetails;

  if (matchingAtoms) {
    addAtomsOrBondsToHighlight({
      indicies: matchingAtoms,
      highlightColors: highlightAtomColors,
      indiciesToHighlight: atomsToDrawWithHighlight,
      color: alignmentDetails.highlightColor,
    });
  }
  if (matchingBonds) {
    addAtomsOrBondsToHighlight({
      indicies: matchingBonds,
      highlightColors: highlightBondColors,
      indiciesToHighlight: bondsToDrawWithHighlight,
      color: alignmentDetails.highlightColor,
    });
  }
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
