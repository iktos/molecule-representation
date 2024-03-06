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
  createHitboxPathFromPath,
  createHitboxRectFromCoords,
  getPathEdgePoints,
  getSvgDimensionsWithAppendedElements,
  isElementInParentBySelector,
  waitForChildFromParent,
} from './html';
import {
  getAtomIdsFromClassnames,
  getAtomIdxFromClickableId,
  getBondIdFromClassnames,
  getBondSelector,
  getClickableAtomIdFromAtomIdx,
  getClickableBondId,
  getVisibleAtomSelector,
  isHighlightingPath,
  isIdClickedABond,
} from './identifiers';

export interface Rect {
  height: number;
  id: string;
  width: number;
  x: number;
  y: number;
}

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

export interface ClickedBondIdentifiers {
  bondId: string;
  startAtomId: string;
  endAtomId: string;
}

export const buildAtomsHitboxes = async ({
  numAtoms,
  parentDiv,
  clickableAtoms,
}: {
  numAtoms: number;
  parentDiv: SVGElement | null;
  clickableAtoms?: number[];
}) => {
  if (!parentDiv) return [];

  let atomsToIgnore = clickableAtoms
    ? new Set([...Array(numAtoms).keys()].filter((atomIdx) => !clickableAtoms.includes(atomIdx)))
    : null;
  const rectsForHiddenAtoms = await computeClickingHiddenAtomsHitboxCoords(numAtoms, parentDiv, atomsToIgnore);
  const processedHiddenAtomsIds = rectsForHiddenAtoms.map((rect) => getAtomIdxFromClickableId(rect.id)).map(parseFloat);
  atomsToIgnore = atomsToIgnore
    ? new Set([...atomsToIgnore, ...processedHiddenAtomsIds])
    : new Set(processedHiddenAtomsIds);
  const rectsForVisibleAtoms = await computeClickingVisibleAtomsHitboxCoords(numAtoms, parentDiv, atomsToIgnore);

  const hitboxesCoords = [...rectsForVisibleAtoms, ...rectsForHiddenAtoms];
  return hitboxesCoords.map((rect) => createHitboxRectFromCoords(rect));
};

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
        const { left, top } = matchedElem.getBoundingClientRect();
        attachedIconPlacements.push({
          xTranslate: left - (svgWidth * scale) / 2,
          yTranslate: top - (svgHeight * scale) / 2,
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

export const buildBondsHitboxes = async (numAtoms: number, parentDiv: SVGElement | null): Promise<SVGPathElement[]> => {
  if (!parentDiv) return [];
  const clickablePaths: SVGPathElement[] = [];
  for (let atomIdx = 0; atomIdx < numAtoms; atomIdx++) {
    const matchedElems = (await waitForChildFromParent(getBondSelector(atomIdx), parentDiv)) as SVGPathElement[];
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
      const hitboxPath = createHitboxPathFromPath(
        elem,
        getClickableBondId({
          bondId: bondIndicies[0],
          startAtomId: atomIndicesInBond[0],
          endAtomId: atomIndicesInBond[1],
        }),
      );
      clickablePaths.push(hitboxPath);
    }
  }
  return clickablePaths;
};

const computeClickingVisibleAtomsHitboxCoords = async (
  numAtoms: number,
  parentDiv: SVGElement,
  atomsToIgnore: Set<number> | null = null,
) => {
  const rects: Rect[] = [];
  for (let atomIdx = 0; atomIdx < numAtoms; atomIdx++) {
    if (atomsToIgnore && atomsToIgnore.has(atomIdx)) continue;

    const matchedElems = (await waitForChildFromParent(getVisibleAtomSelector(atomIdx), parentDiv)) as HTMLElement[];

    for (const elem of matchedElems) {
      const elemPosition = elem.getBoundingClientRect();
      const parent = elem.parentElement;
      if (!parent) {
        continue;
      }
      const parentPosition = parent.getBoundingClientRect();
      rects.push({
        id: getClickableAtomIdFromAtomIdx(atomIdx),
        x: elemPosition.x - parentPosition.x,
        y: elemPosition.y - parentPosition.y,
        height: elemPosition.height,
        width: elemPosition.width,
      });
    }
  }
  return rects;
};

const computeClickingHiddenAtomsHitboxCoords = async (
  numAtoms: number,
  parentDiv: SVGElement,
  atomsToIgnore: Set<number> | null = null,
) => {
  const rects: Rect[] = [];
  for (let atomIdx = 0; atomIdx < numAtoms; atomIdx++) {
    if (atomsToIgnore && atomsToIgnore.has(atomIdx)) continue;

    const matchedElems = (await waitForChildFromParent(getBondSelector(atomIdx), parentDiv)) as SVGPathElement[];

    for (const elem of matchedElems) {
      if ((elem.id && isIdClickedABond(elem.id)) || isHighlightingPath(elem)) {
        // ignore bonds hitboxes
        continue;
      }
      const atomIndicesInBond = getAtomIdsFromClassnames(elem.classList);

      const startAtomIndex = atomIndicesInBond[0];
      const endAtomIndex = atomIndicesInBond[1];

      const { end, length, start } = getPathEdgePoints(elem);
      if (
        !isElementInParentBySelector(getVisibleAtomSelector(startAtomIndex), parentDiv) &&
        !atomsToIgnore?.has(startAtomIndex)
      ) {
        rects.push({
          id: getClickableAtomIdFromAtomIdx(startAtomIndex),
          x: start.x - length / 4,
          y: start.y - length / 4,
          height: length / 2,
          width: length / 2,
        });
      }
      if (
        !isElementInParentBySelector(getVisibleAtomSelector(endAtomIndex), parentDiv) &&
        !atomsToIgnore?.has(endAtomIndex)
      ) {
        rects.push({
          id: getClickableAtomIdFromAtomIdx(endAtomIndex),
          x: end.x - length / 4,
          y: end.y - length / 4,
          height: length / 2,
          width: length / 2,
        });
      }
    }
  }
  return rects;
};
