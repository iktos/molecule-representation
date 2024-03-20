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
  createHitboxFromAtomEllipse,
  createHitboxPathFromPath,
  getPathEdgePoints,
  getSvgDimensionsWithAppendedElements,
  waitForChildFromParent,
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

export const computeIconsCoords = async ({
  parentDiv,
  attachedIcons,
}: {
  parentDiv: SVGElement | null;
  attachedIcons: AttachedSvgIcon[];
}): Promise<IconCoords[]> => {
  if (!parentDiv) return [];
  const coords: IconCoords[] = [];

  for (const attachedIcon of attachedIcons) {
    const attachedIconPlacements: IconsPlacements[] = [];
    const svgDimenssions = getSvgDimensionsWithAppendedElements(attachedIcon.svg);
    if (!svgDimenssions) {
      continue;
    }
    const { width: svgWidth, height: svgHeight } = svgDimenssions;
    const refrenceAtom = (await waitForChildFromParent('ellipse.atom-0', parentDiv)) as SVGPathElement[];
    const scale = refrenceAtom.length
      ? Math.min(
          (parseFloat(refrenceAtom[0].getAttribute('rx') ?? '0.5') * 2) / svgWidth,
          (parseFloat(refrenceAtom[0].getAttribute('ry') ?? '0.5') * 2) / svgHeight,
        )
      : 1;
    const processedBondIds = new Set();

    for (const atomId of attachedIcon.atomIds) {
      const matchedElems = (await waitForChildFromParent(`ellipse.atom-${atomId}`, parentDiv)) as SVGPathElement[];
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
      const matchedElems = (await waitForChildFromParent(`.bond-${bondId}`, parentDiv)) as SVGPathElement[];
      for (const matchedElem of matchedElems) {
        if (processedBondIds.has(bondId)) {
          // this is here to ignore double bonds
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
    const matchedElems = (await waitForChildFromParent(
      getBondSelectorIdentifier(atomIdx),
      parentSvg,
    )) as SVGPathElement[];
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
    const matchedElems = (await waitForChildFromParent(
      getAtomHighliteEllipseIdentifier(atomIdx),
      parentSvg,
    )) as SVGEllipseElement[];

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
