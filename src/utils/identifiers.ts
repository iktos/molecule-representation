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

import { BondIdentifiers } from './svg-computation';

export const CLICKABLE_MOLECULE_CLASSNAME = 'clickable-molecule';
const CLICKABLE_ATOM_ID = 'clickable-atom-';
const CLICKABLE_BOND_ID = 'clickable-bond-';

export const isIdClickedAnAtom = (id: string) => id.includes(CLICKABLE_ATOM_ID);
export const isIdClickedABond = (id: string) => id.includes(CLICKABLE_BOND_ID);
export const isHighlightingPath = (path: SVGPathElement) => path.style.strokeWidth === '0px';

// clickable atoms ids
export const getClickableAtomIdFromAtomIdx = (atomIdx: number) => `${CLICKABLE_ATOM_ID}${atomIdx}`;
export const getAtomIdxFromClickableId = (id: string) => id.replace(CLICKABLE_ATOM_ID, '');
export const getAtomIdsFromClassnames = (bondClassnames: DOMTokenList) =>
  Array.from(bondClassnames)
    .filter((className: string) => className.includes('atom-'))
    .map((className) => className.replace('atom-', ''))
    .map(parseFloat);

// clickable bonds ids
export const getClickableBondId = ({
  bondId,
  startAtomId,
  endAtomId,
}: {
  bondId: number;
  startAtomId: number;
  endAtomId: number;
}) => `${CLICKABLE_BOND_ID}${bondId}:-atoms:${startAtomId}-${endAtomId}`;
export const getClickedBondIdentifiersFromId = (id: string): BondIdentifiers => {
  const [bondId, atomsId] = id.replace(CLICKABLE_BOND_ID, '').replace('-atoms', '').split('::');
  const [startAtomId, endAtomId] = atomsId.split('-');
  return { bondId, startAtomId, endAtomId };
};
export const getBondIdFromClassnames = (bondClassnames: DOMTokenList) =>
  Array.from(bondClassnames)
    .filter((className: string) => className.includes('bond-'))
    .map((className) => className.replace('bond-', ''))
    .map(parseFloat);

// selectors
export const getBondSelectorIdentifier = (atomIdx: number) => `.atom-${atomIdx}[class*="bond"]`;
export const getAtomHighliteEllipseIdentifier = (atomIdx: number) => `ellipse.atom-${atomIdx}`;
