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

import { cloneElement } from 'react';
import convert from 'react-from-dom';
import {
  createHitboxFromAtomEllipse,
  createHitboxPathFromPath,
  getPathEdgePoints,
  getSvgDimensionsWithAppendedElements,
} from './html';
import {
  getAtomHighliteEllipseIdentifier,
  getAtomIdsFromClassnames,
  getBondIdFromClassnames,
  getBondSelectorIdentifier,
  getClickableAtomIdFromAtomIdx,
  getClickableBondId,
  isHighlightingPath,
} from './identifiers';

export const createSvgElement = (svg: string, svgProps?: Record<string, unknown>) => {
  if (!svg) throw new Error('Missing svg');

  const element = convert(svg);

  if (!element) throw new Error('Could not convert to element');

  return cloneElement(element as React.ReactElement, { ...svgProps });
};

export const computeIconsCoords = async ({
  svg,
  attachedIcons,
}: {
  svg: string;
  attachedIcons: AttachedSvgIcon[];
}): Promise<IconCoords[]> => {
  if (!svg) return [];
  const coords: IconCoords[] = [];
  const parentWrapper = document.createElement('div');
  parentWrapper.innerHTML = svg;
  const parentSvg = parentWrapper.getElementsByTagName('svg')[0];
  if (!parentSvg) return [];

  for (const attachedIcon of attachedIcons) {
    const attachedIconPlacements: IconsPlacements[] = [];
    const svgDimenssions = getSvgDimensionsWithAppendedElements(attachedIcon.svg);
    if (!svgDimenssions) {
      continue;
    }
    const { width: svgWidth, height: svgHeight } = svgDimenssions;
    const referenceAtoms = Array.from(parentSvg.querySelectorAll('ellipse.atom-0')) as SVGPathElement[];
    const scale = referenceAtoms.length
      ? Math.min(
          (parseFloat(referenceAtoms[0].getAttribute('rx') ?? '0.5') * 2) / svgWidth,
          (parseFloat(referenceAtoms[0].getAttribute('ry') ?? '0.5') * 2) / svgHeight,
        )
      : 1;
    const processedBondIds = new Set();

    for (const atomId of attachedIcon.atomIds) {
      const matchedElems = Array.from(parentSvg.querySelectorAll(`ellipse.atom-${atomId}`)) as SVGPathElement[];
      for (const matchedElem of matchedElems) {
        const { x, y } = matchedElem.getBoundingClientRect();
        const cx = parseFloat(matchedElem.getAttribute('cx') ?? `${x}`);
        const cy = parseFloat(matchedElem.getAttribute('cy') ?? `${y}`);
        attachedIconPlacements.push({
          xTranslate: cx,
          yTranslate: cy,
        });
      }
    }

    for (const bondId of attachedIcon.bondIds) {
      const matchedElems = Array.from(parentSvg.querySelectorAll(`.bond-${bondId}`)) as SVGPathElement[];
      for (const matchedElem of matchedElems) {
        if (processedBondIds.has(bondId)) {
          // ignore double bonds
          continue;
        }
        if (matchedElem.id.includes('clickable') || isHighlightingPath(matchedElem)) {
          // ignore clickable & highlighted (they are duplicates of the original bond)
          continue;
        }
        const { start, end } = getPathEdgePoints(matchedElem);
        attachedIconPlacements.push({
          xTranslate: (start.x + end.x) / 2,
          yTranslate: (start.y + end.y) / 2,
        });
        processedBondIds.add(bondId);
      }
    }

    coords.push({
      svg: attachedIcon.svg,
      scale,
      placements: attachedIconPlacements.map((placement) => ({
        ...placement,
        xTranslate: placement.xTranslate - (svgWidth * scale) / 2,
        yTranslate: placement.yTranslate - (svgHeight * scale) / 2,
      })),
    });
  }
  return coords;
};

export const buildBondsHitboxes = async ({
  // this doesn't look into dom, but uses the svg string instead
  numAtoms,
  svg,
  isClickable,
}: {
  numAtoms: number;
  svg: string;
  isClickable: boolean;
}): Promise<SVGPathElement[]> => {
  const parentWrapper = document.createElement('div');
  parentWrapper.innerHTML = svg;
  const parentSvg = parentWrapper.getElementsByTagName('svg')[0];
  if (!parentSvg) return [];
  const clickablePaths: SVGPathElement[] = [];
  for (let atomIdx = 0; atomIdx < numAtoms; atomIdx++) {
    const matchedElems = Array.from(parentSvg.querySelectorAll(getBondSelectorIdentifier(atomIdx))) as SVGPathElement[];
    for (const elem of matchedElems) {
      const atomIndicesInBond = getAtomIdsFromClassnames(elem.classList);
      const bondIndicies = getBondIdFromClassnames(elem.classList);
      if (bondIndicies.length !== 1 || atomIndicesInBond.length !== 2) {
        console.error('[@iktos-oss/molecule-representation] invalid bond classname', bondIndicies, elem.classList);
        continue;
      }
      if (isHighlightingPath(elem)) {
        continue;
      }
      const hitboxPath = createHitboxPathFromPath({
        path: elem,
        id: getClickableBondId({
          bondId: bondIndicies[0],
          startAtomId: atomIndicesInBond[0],
          endAtomId: atomIndicesInBond[1],
        }),
        isClickable,
      });
      clickablePaths.push(hitboxPath);
    }
  }
  return clickablePaths;
};
export const buildAtomsHitboxes = async ({
  // this doesn't look into dom, but uses the svg string instead
  numAtoms,
  svg,
  clickableAtoms,
  isClickable,
}: {
  numAtoms: number;
  svg: string;
  clickableAtoms: Set<number> | null;
  isClickable: boolean;
}): Promise<SVGEllipseElement[]> => {
  const parentWrapper = document.createElement('div');
  parentWrapper.innerHTML = svg;
  const parentSvg = parentWrapper.getElementsByTagName('svg')[0];
  if (!parentSvg) return [];

  const clickablePaths: SVGEllipseElement[] = [];
  for (let atomIdx = 0; atomIdx < numAtoms; atomIdx++) {
    if (clickableAtoms && !clickableAtoms.has(atomIdx)) {
      // ignore non clickableAtoms if clickableAtoms is specified
      continue;
    }
    const matchedElems = Array.from(
      parentSvg.querySelectorAll(getAtomHighliteEllipseIdentifier(atomIdx)),
    ) as SVGEllipseElement[];

    for (const elem of matchedElems) {
      const atomIndicesInBond = getAtomIdsFromClassnames(elem.classList);
      if (atomIndicesInBond.length !== 1) {
        console.warn('Found an ellipse with more than one atomid');
        continue;
      }
      const hitboxPath = createHitboxFromAtomEllipse({
        ellipse: elem,
        id: getClickableAtomIdFromAtomIdx(atomIdx),
        isClickable,
      });
      clickablePaths.push(hitboxPath);
    }
  }
  return clickablePaths;
};

export interface AttachedSvgIcon {
  svg: string;
  atomIds: number[];
  bondIds: number[];
}

export interface IconCoords {
  svg: string;
  scale: number;
  placements: IconsPlacements[];
}

interface IconsPlacements {
  xTranslate: number;
  yTranslate: number;
}

export interface BondIdentifiers {
  bondId: string;
  startAtomId: string;
  endAtomId: string;
}
