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
  getAtomSelectorIdentifier,
  getBondIdFromClassnames,
  getBondSelectorIdentifier,
  getClickableAtomIdFromAtomIdx,
  getClickableBondId,
  isHighlightingPath,
  RDKIT_ATOMS_CLASS_REGEX,
  RDKIT_ATOMS_LABELS_PATHS_IDENTIFIER,
  RDKIT_BONDS_PATHS_IDENTIFIER,
  RDKIT_HIGHLIGHTED_ELIPSES_IDENTIFIER,
} from './identifiers';

const IDENTITY_SVG_TRANSFORM: SvgTransform = { scale: 1, dx: 0, dy: 0 };
const SVG_PATH_POINTS_REGEX = /(-?\d+(?:\.\d+)?)[, ](-?\d+(?:\.\d+)?)/g;
const MAX_SVG_TRANSFORM_RESIDUAL_PX = 2;

export const createSvgElement = (svg: string, svgProps?: Record<string, unknown>) => {
  if (!svg) throw new Error('Missing svg');

  const element = convert(svg);

  if (!element) throw new Error('Could not convert to element');

  return cloneElement(element as React.ReactElement, { ...svgProps });
};

export const computeIconsCoords = ({
  svg,
  attachedIcons,
  transform,
}: {
  svg: string;
  attachedIcons: AttachedSvgIcon[];
  transform?: SvgTransform | null;
}): IconCoords[] => {
  if (!svg) return [];
  const iconsTransform = transform ?? IDENTITY_SVG_TRANSFORM;
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
      ? iconsTransform.scale *
        Math.min(
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
        xTranslate: iconsTransform.scale * placement.xTranslate + iconsTransform.dx - (svgWidth * scale) / 2,
        yTranslate: iconsTransform.scale * placement.yTranslate + iconsTransform.dy - (svgHeight * scale) / 2,
      })),
    });
  }
  return coords;
};

const getPathsPointsByClassname = (parent: ParentNode, selector: string) => {
  const pathsPointsByClassname = new Map<string, SvgPoint[][]>();
  parent.querySelectorAll<SVGPathElement>(selector).forEach((path) => {
    const classname = path.getAttribute('class');
    if (!classname || path.id || isHighlightingPath(path)) return;
    const points = Array.from(
      path.getAttribute('d')?.matchAll(SVG_PATH_POINTS_REGEX) ?? [],
      ([, x, y]): SvgPoint => [parseFloat(x), parseFloat(y)],
    );
    const paths = pathsPointsByClassname.get(classname);
    if (paths) {
      paths.push(points);
    } else {
      pathsPointsByClassname.set(classname, [points]);
    }
  });
  return pathsPointsByClassname;
};

const pairPathsPoints = (source: Map<string, SvgPoint[][]>, target: Map<string, SvgPoint[][]>) => {
  const pairs: [SvgPoint, SvgPoint][] = [];
  source.forEach((sourcePaths, classname) => {
    const targetPaths = target.get(classname);
    if (!targetPaths || targetPaths.length !== sourcePaths.length) return;
    if (sourcePaths.some((points, i) => points.length !== targetPaths[i].length)) return;
    sourcePaths.forEach((points, i) => points.forEach((point, j) => pairs.push([point, targetPaths[i][j]])));
  });
  return pairs;
};

const fitSvgTransform = (pairs: [SvgPoint, SvgPoint][]): SvgTransform | null => {
  if (pairs.length < 2) return null;
  const mean = (pick: (pair: [SvgPoint, SvgPoint]) => number) =>
    pairs.reduce((sum, pair) => sum + pick(pair), 0) / pairs.length;
  const sourceX = mean(([source]) => source[0]);
  const sourceY = mean(([source]) => source[1]);
  const targetX = mean(([, target]) => target[0]);
  const targetY = mean(([, target]) => target[1]);

  let covariance = 0;
  let variance = 0;
  for (const [[sx, sy], [tx, ty]] of pairs) {
    covariance += (sx - sourceX) * (tx - targetX) + (sy - sourceY) * (ty - targetY);
    variance += (sx - sourceX) ** 2 + (sy - sourceY) ** 2;
  }
  if (!variance) return null;

  const scale = covariance / variance;
  const transform = { scale, dx: targetX - scale * sourceX, dy: targetY - scale * sourceY };
  const maxResidual = pairs.reduce(
    (max, [[sx, sy], [tx, ty]]) =>
      Math.max(max, Math.hypot(scale * sx + transform.dx - tx, scale * sy + transform.dy - ty)),
    0,
  );
  return maxResidual > MAX_SVG_TRANSFORM_RESIDUAL_PX ? null : transform;
};

const computeTransformBetweenParents = (source: ParentNode, target: ParentNode): SvgTransform | null => {
  const pairs = pairPathsPoints(
    getPathsPointsByClassname(source, RDKIT_BONDS_PATHS_IDENTIFIER),
    getPathsPointsByClassname(target, RDKIT_BONDS_PATHS_IDENTIFIER),
  );
  if (pairs.length < 2) {
    pairs.push(
      ...pairPathsPoints(
        getPathsPointsByClassname(source, RDKIT_ATOMS_LABELS_PATHS_IDENTIFIER),
        getPathsPointsByClassname(target, RDKIT_ATOMS_LABELS_PATHS_IDENTIFIER),
      ),
    );
  }
  return fitSvgTransform(pairs);
};

export const computeSvgTransform = (sourceSvg: string, targetSvg: string): SvgTransform | null => {
  const source = document.createElement('div');
  source.innerHTML = sourceSvg;
  const target = document.createElement('div');
  target.innerHTML = targetSvg;
  return computeTransformBetweenParents(source, target);
};

const transformEllipse = (ellipse: SVGEllipseElement, { scale, dx, dy }: SvgTransform) => {
  const readAttribute = (name: string) => parseFloat(ellipse.getAttribute(name) ?? '0');
  ellipse.setAttribute('cx', (scale * readAttribute('cx') + dx).toFixed(1));
  ellipse.setAttribute('cy', (scale * readAttribute('cy') + dy).toFixed(1));
  ellipse.setAttribute('rx', (scale * readAttribute('rx')).toFixed(1));
  ellipse.setAttribute('ry', (scale * readAttribute('ry')).toFixed(1));
};

const getEllipsesInsertionIndex = (svg: string) => {
  const backgroundRectEndIndex = svg.indexOf('</rect>');
  return backgroundRectEndIndex !== -1 ? backgroundRectEndIndex + '</rect>'.length : svg.lastIndexOf('</svg>');
};

export const buildBondsHitboxes = ({
  // this doesn't look into dom, but uses the svg string instead
  numAtoms,
  svg,
  isClickable,
}: {
  numAtoms: number;
  svg: string;
  isClickable: boolean;
}): SVGPathElement[] => {
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
export const buildAtomsHitboxes = ({
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
}): SVGEllipseElement[] => {
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

export const applyUserStyles = ({
  svg,
  numAtoms,
  atomsStyles,
  bondsStyles,
}: {
  svg: string;
  numAtoms: number;
  atomsStyles: AtomsStyles | undefined;
  bondsStyles: BondsStyles | undefined;
}): string => {
  if (!atomsStyles && !bondsStyles) return svg;
  const parentWrapper = document.createElement('div');
  parentWrapper.innerHTML = svg;
  const parentSvg = parentWrapper.getElementsByTagName('svg')[0];
  if (!parentSvg) return svg;

  const { default: defaultAtomsStyles, ...specificAtomsStyles } = atomsStyles || {};
  const { default: defaultBondsStyles, ...specificBondsStyles } = bondsStyles || {};
  for (let atomIdx = 0; atomIdx < numAtoms; atomIdx++) {
    const matchedAtomsElems = Array.from(
      parentSvg.querySelectorAll(getAtomSelectorIdentifier(atomIdx)),
    ) as SVGPathElement[];
    const matchedBondsElems = Array.from(
      parentSvg.querySelectorAll(getBondSelectorIdentifier(atomIdx)),
    ) as SVGPathElement[];
    for (const matchedElem of matchedAtomsElems) {
      const stylesToApply = specificAtomsStyles[atomIdx] || defaultAtomsStyles || {};
      Object.assign(matchedElem.style, stylesToApply);
    }
    for (const matchedElem of matchedBondsElems) {
      const [bondId] = getBondIdFromClassnames(matchedElem.classList);
      const [startAtomId, endAtomId] = Array.from(matchedElem.classList)
        .filter((c) => c.includes('atom'))
        .map((c) => parseInt(c.replace('atom-', '')));
      const stylesToApply =
        specificBondsStyles[bondId] ||
        specificBondsStyles[`${startAtomId}-${endAtomId}`] ||
        specificBondsStyles[`${startAtomId}-*`] ||
        specificBondsStyles[`*-${endAtomId}`] ||
        defaultBondsStyles ||
        {};
      Object.assign(matchedElem.style, stylesToApply);
    }
  }

  return parentWrapper.innerHTML;
};

export const appendEllipsesToSvg = (mainSvg: string, ellipsesSourceSvg: string | null): string => {
  if (!ellipsesSourceSvg || !mainSvg) {
    return mainSvg;
  }

  try {
    const mainParser = document.createElement('div');
    mainParser.innerHTML = mainSvg;
    const existingAtomIndexes = new Set<string>();

    const mainEllipses = mainParser.querySelectorAll<SVGEllipseElement>(RDKIT_HIGHLIGHTED_ELIPSES_IDENTIFIER);

    // collect already present clickable atoms from main svg
    mainEllipses.forEach((el) => {
      const classString = el.className.baseVal;
      const match = classString.match(RDKIT_ATOMS_CLASS_REGEX);
      if (match && match[1]) {
        existingAtomIndexes.add(match[1]);
      }
    });

    // collect only the ellipses for atoms not already present from ellipses svg
    const sourceParser = document.createElement('div');
    sourceParser.innerHTML = ellipsesSourceSvg;
    const sourceEllipses = sourceParser.querySelectorAll<SVGEllipseElement>(RDKIT_HIGHLIGHTED_ELIPSES_IDENTIFIER);
    const transform = computeTransformBetweenParents(sourceParser, mainParser) ?? IDENTITY_SVG_TRANSFORM;

    const ellipsesToAdd: string[] = [];
    sourceEllipses.forEach((el) => {
      const classString = el.className.baseVal;
      const match = classString.match(RDKIT_ATOMS_CLASS_REGEX);
      if (match && match[1] && !existingAtomIndexes.has(match[1])) {
        transformEllipse(el, transform);
        ellipsesToAdd.push(el.outerHTML);
      }
    });

    // if there are new, unique ellipses to add, append them to the main svg
    if (ellipsesToAdd.length > 0) {
      const ellipsesString = ellipsesToAdd.join('');
      const insertionIndex = getEllipsesInsertionIndex(mainSvg);
      if (insertionIndex !== -1) {
        return mainSvg.substring(0, insertionIndex) + ellipsesString + mainSvg.substring(insertionIndex);
      }
    }
  } catch (error) {
    console.error('Error processing and de-duplicating clickableSvg ellipses:', error);
    return mainSvg;
  }

  return mainSvg; // return original if no new ellipses were found
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

export interface SvgTransform {
  scale: number;
  dx: number;
  dy: number;
}

type SvgPoint = [number, number];

interface IconsPlacements {
  xTranslate: number;
  yTranslate: number;
}

export interface BondIdentifiers {
  bondId: string;
  startAtomId: string;
  endAtomId: string;
}

type CustomStyles = Record<string, string | number>;
export interface AtomsStyles {
  [atomId: number]: CustomStyles; // style for specific atoms
  default?: CustomStyles; // default style for all atoms
}

export interface BondsStyles {
  [bondId: number]: CustomStyles; // style for specific bonds (by bond id)
  [atomIds: `${number}-${number}`]: CustomStyles; // style for bonds identified by atom IDs
  [atomIds: `${number}-*`]: CustomStyles; // style for bonds identified by atom IDs
  [atomIds: `*-${number}`]: CustomStyles; // style for bonds identified by atom IDs
  default?: CustomStyles; // default style for all bonds
}
