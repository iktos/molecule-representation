/*
  MIT License

  Copyright (c) 2023 Iktos

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
*/
import {
  getSvg,
  getMoleculeDetails,
  getCanonicalFormForStructure,
  getMatchingSubstructure,
  getSvgFromSmarts,
  RDKitColor,
  convertMolNotation,
  GetMoleculeDetailsOutputType,
} from '@iktos-oss/rdkit-provider';
import { AlignmentDetails } from '../components';
import { HIGHLIGHT_RDKIT_COLORS, TRANSPARANT_RDKIT_COLOR } from '../constants';
import { appendEllipsesToSvg } from './svg-computation';

const DEFAULT_DRAWING_DETAILS = {
  bondLineWidth: 1,
  backgroundColour: [1, 1, 1, 0] as RDKitColor,
  highlightColour: HIGHLIGHT_RDKIT_COLORS[0],
  highlightRadius: 0.3,
  fixedBondLength: 50,
};

export const get_svg = async (props: DrawSmilesSVGProps, worker: Worker): Promise<string | null> => {
  const {
    smiles: initialSmiles,
    width,
    height,
    details = {},
    atomsToHighlight = [],
    bondsToHighlight = [],
    isClickable,
    clickableAtoms,
    alignmentDetails,
    heatmapAtomsWeights = {},
    highlightColor,
    canonicalize,
    generateClickableHotspots = false,
  } = props;

  if (!initialSmiles) return null;

  let smiles = initialSmiles;
  if (canonicalize) {
    const { canonicalForm } = await getCanonicalFormForStructure(worker, { structure: initialSmiles });
    if (!canonicalForm) return null;
    smiles = canonicalForm;
  }

  let clickableSvg;
  if (isClickable && !generateClickableHotspots) {
    clickableSvg = await get_svg({ ...props, smiles, generateClickableHotspots: true }, worker);
  }

  const moleculeDetails = await getMoleculeDetails(worker, { smiles, returnFullDetails: true });
  if (!moleculeDetails) return null;

  const baseAtomColors = getHighlightColors(atomsToHighlight, highlightColor);
  const baseBondColors = getHighlightColors(bondsToHighlight, highlightColor);

  const { highlightAtomRadii, heatmapHighlightColors } = computeHeatmapOptions(heatmapAtomsWeights, highlightColor);

  const { atomHighlights: alignmentAtomColors, bondHighlights: alignmentBondColors } = alignmentDetails
    ? await computeAlignmentHighlights(worker, smiles, alignmentDetails)
    : { atomHighlights: {}, bondHighlights: {} };

  const clickableAtomBgColors = computeClickableAtomHighlights(
    moleculeDetails,
    clickableAtoms,
    generateClickableHotspots,
  );

  const highlightAtomColors: HighlightColors = {
    ...clickableAtomBgColors,
    ...heatmapHighlightColors,
    ...alignmentAtomColors,
    ...baseAtomColors,
  };
  const highlightBondColors: HighlightColors = { ...alignmentBondColors, ...baseBondColors };

  const atomsToDraw = generateClickableHotspots
    ? Object.keys(highlightAtomColors).map(Number)
    : [
        ...atomsToHighlight.flat(),
        ...(clickableAtoms?.clickableAtomsIds ?? []),
        ...Object.keys(heatmapAtomsWeights)
          .map((n) => parseInt(n) ?? null)
          .filter((n) => n !== null),
      ];
  const bondsToDraw = Object.keys(highlightBondColors).map(Number);

  const rdkitDrawingOptions = {
    ...DEFAULT_DRAWING_DETAILS,
    width,
    height,
    atoms: atomsToDraw,
    bonds: bondsToDraw,
    highlightAtomColors,
    highlightBondColors,
    highlightAtomRadii,
    ...details,
  };

  try {
    let { svg } = await getSvg(worker, {
      smiles,
      drawingDetails: rdkitDrawingOptions,
      alignmentDetails,
    });

    if (svg && clickableSvg) {
      svg = appendEllipsesToSvg(svg, clickableSvg);
    }

    if (!svg && alignmentDetails) {
      console.error('@iktos-oss/molecule-representation: Failed to draw with alignment, falling back to no alignment.');
      const { svg: svgRetry } = await getSvg(worker, { smiles, drawingDetails: rdkitDrawingOptions });
      return svgRetry;
    }

    return svg;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const get_svg_from_smarts = async (
  props: DrawSmartsSVGProps,
  drawAsSmiles = false,
  worker: Worker,
): Promise<string | null> => {
  if (!worker || !props.smarts) return null;

  const { canonicalForm: canonicalSmarts } = await getCanonicalFormForStructure(worker, {
    structure: props.smarts,
    useQMol: true,
  });
  if (!canonicalSmarts) return null;

  if (drawAsSmiles) {
    const { svg } = await getSvg(worker, {
      ...props,
      smiles: props.smarts,
    });
    return svg;
  }

  const { svg } = await getSvgFromSmarts(worker, {
    ...props,
    smarts: canonicalSmarts,
  });
  return svg;
};

function getHighlightColors(items: number[][] = [], highlightColor?: RDKitColor): HighlightColors {
  // give each array of atoms a color, enabling multi-color highlights
  const highlightColors: HighlightColors = {};
  const limit = HIGHLIGHT_RDKIT_COLORS.length;
  items.forEach((item, i) => {
    const color = highlightColor ?? HIGHLIGHT_RDKIT_COLORS[i % limit];
    if (!item) return;
    for (const index of item) {
      highlightColors[index] = color;
    }
  });
  return highlightColors;
}

function computeHeatmapOptions(heatmapAtomsWeights: Record<number, number> = {}, highlightColor?: RDKitColor) {
  const highlightAtomRadii: Record<number, number> = {};
  const heatmapHighlightColors: HighlightColors = {};

  const weights = Object.values(heatmapAtomsWeights);
  if (weights.length === 0) return { highlightAtomRadii, heatmapHighlightColors };

  const maxWeight = Math.max(...weights);
  const minWeight = Math.min(...weights);
  const weightRange = maxWeight - minWeight || 1;
  const minRadius = 0.15;
  const maxRadius = 0.5;

  for (const [atomIdx, weight] of Object.entries(heatmapAtomsWeights)) {
    const normalizedWeight = (weight - minWeight) / weightRange;
    highlightAtomRadii[+atomIdx] = minRadius + normalizedWeight * (maxRadius - minRadius);
  }

  const atomIndices = [Object.keys(heatmapAtomsWeights).map(Number)];
  Object.assign(heatmapHighlightColors, getHighlightColors(atomIndices, highlightColor));

  return { highlightAtomRadii, heatmapHighlightColors };
}

async function computeAlignmentHighlights(worker: Worker, smiles: string, alignmentDetails: AlignmentDetails) {
  const atomHighlights: HighlightColors = {};
  const bondHighlights: HighlightColors = {};

  if (!alignmentDetails.highlightColor || !alignmentDetails.molBlock) {
    return { atomHighlights, bondHighlights };
  }

  const { structure: smarts } = await convertMolNotation(worker, {
    moleculeString: alignmentDetails.molBlock,
    targetNotation: 'smarts',
    sourceNotation: 'molblock',
  });
  if (!smarts) return { atomHighlights, bondHighlights };

  const match = await getMatchingSubstructure(worker, { structure: smiles, substructure: smarts });
  if (!match) return { atomHighlights, bondHighlights };

  const color = alignmentDetails.highlightColor;
  match.matchingAtoms?.forEach((idx) => (atomHighlights[idx] = color));
  match.matchingBonds?.forEach((idx) => (bondHighlights[idx] = color));

  return { atomHighlights, bondHighlights };
}

function computeClickableAtomHighlights(
  moleculeDetails: GetMoleculeDetailsOutputType,
  clickableAtoms: ClickableAtoms | undefined,
  isForClickableOverlay: boolean,
): HighlightColors {
  if (!moleculeDetails) return {};
  const clickableAtomColors: HighlightColors = {};
  const backgroundColor = clickableAtoms?.clickableAtomsBackgroundColor ?? TRANSPARANT_RDKIT_COLOR;
  const clickableAtomIds = clickableAtoms?.clickableAtomsIds ?? [...Array(moleculeDetails.NumHeavyAtoms).keys()];

  for (const atomId of clickableAtomIds) {
    clickableAtomColors[atomId] = isForClickableOverlay ? TRANSPARANT_RDKIT_COLOR : backgroundColor;
  }
  if (isForClickableOverlay) {
    for (let i = 0; i < moleculeDetails.NumHeavyAtoms; i++) {
      if (!clickableAtomIds.includes(i)) {
        clickableAtomColors[i] = TRANSPARANT_RDKIT_COLOR;
      }
    }
  }

  return clickableAtomColors;
}

export interface DrawSmilesSVGProps {
  smiles: string;
  width: number;
  height: number;
  details?: Record<string, unknown>;
  alignmentDetails?: AlignmentDetails;
  heatmapAtomsWeights?: Record<number, number>;
  highlightColor?: RDKitColor;
  atomsToHighlight?: number[][];
  bondsToHighlight?: number[][];
  isClickable?: boolean;
  clickableAtoms?: ClickableAtoms;
  canonicalize?: boolean;
  generateClickableHotspots?: boolean;
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
