import { getPathEdgePoints, isElementInParentBySelector, Rect, waitForChildFromParent } from '../../utils/html';

export const CLICKABLE_MOLECULE_CLASSNAME = 'clickable-molecule';
const CLICKABLE_ATOM_ID = 'clickable-atom-';
const getClickableAtomIdFromAtomIdx = (atomIdx: number) => `${CLICKABLE_ATOM_ID}${atomIdx}`;
export const getAtomIdxFromClickableId = (id: string) => id.replace(CLICKABLE_ATOM_ID, '');

export const computeClickingAreaForAtoms = async (numAtoms: number, parentDiv: HTMLDivElement | null) => {
  if (!parentDiv) return [];

  const rectsForHiddenAtoms = await computeClickingAreaForHiddenAtoms(numAtoms, parentDiv);
  const processedHiddenAtomsIds = rectsForHiddenAtoms.map((rect) => getAtomIdxFromClickableId(rect.id)).map(parseFloat);
  const rectsForVisibleAtoms = await computeClickingAreaForVisibleAtoms(
    numAtoms,
    parentDiv,
    new Set(processedHiddenAtomsIds),
  );
  return [...rectsForVisibleAtoms, ...rectsForHiddenAtoms];
};

const getVisibleAtomSelector = (atomIdx: number) =>
  `.${CLICKABLE_MOLECULE_CLASSNAME} .atom-${atomIdx}:not(ellipse):not([class*="bond"])`;

const getBondSelector = (atomIdx: number) => `.${CLICKABLE_MOLECULE_CLASSNAME} .atom-${atomIdx}[class*="bond"]`;

const computeClickingAreaForVisibleAtoms = async (
  numAtoms: number,
  parentDiv: HTMLDivElement,
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

const computeClickingAreaForHiddenAtoms = async (numAtoms: number, parentDiv: HTMLDivElement) => {
  const rects: Rect[] = [];
  for (let atomIdx = 0; atomIdx < numAtoms; atomIdx++) {
    const matchedElems = (await waitForChildFromParent(getBondSelector(atomIdx), parentDiv)) as SVGPathElement[];

    for (const elem of matchedElems) {
      const atomIndicesInBond = Array.from(elem.classList)
        .filter((className: string) => className.includes('atom-'))
        .map((className) => className.replace('atom-', ''))
        .map(parseFloat);

      const startAtomIndex = atomIndicesInBond[0];
      const endAtomIndex = atomIndicesInBond[1];

      const { end, length, start } = getPathEdgePoints(elem);
      if (!isElementInParentBySelector(getVisibleAtomSelector(startAtomIndex), parentDiv)) {
        rects.push({
          id: getClickableAtomIdFromAtomIdx(startAtomIndex),
          x: start.x - length / 4,
          y: start.y - length / 4,
          height: length / 2,
          width: length / 2,
        });
      }
      if (!isElementInParentBySelector(getVisibleAtomSelector(endAtomIndex), parentDiv)) {
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
