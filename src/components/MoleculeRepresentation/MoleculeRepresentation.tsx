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

import React, { CSSProperties, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RDKitColor, getMoleculeDetails, isValidSmiles, useRDKit } from '@iktos-oss/rdkit-provider';
import { ZoomWrapper, DisplayZoomToolbar, DisplayZoomToolbarStrings } from '../Zoom';
import { Spinner } from '../Spinner';
import { isEqual } from '../../utils/compare';
import { createSvgElement } from '../../utils/create-svg-element';
import {
  ClickableAtoms,
  DrawSmilesSVGProps,
  get_svg,
  get_svg_from_smarts,
  appendHitboxesToSvg,
  buildAtomsHitboxes,
  buildBondsHitboxes,
  isIdClickedABond,
  getClickedBondIdentifiersFromId,
  isIdClickedAnAtom,
  getAtomIdxFromClickableId,
  CLICKABLE_MOLECULE_CLASSNAME,
  BondIdentifiers,
  IconCoords,
  AttachedSvgIcon,
  computeIconsCoords,
  appendSvgIconsToSvg,
} from '../../utils';

export type MoleculeRepresentationProps = SmilesRepresentationProps | SmartsRepresentationProps;

export const MoleculeRepresentation: React.FC<MoleculeRepresentationProps> = memo(
  ({
    addAtomIndices = false,
    atomsToHighlight,
    bondsToHighlight,
    attachedSvgIcons,
    clickableAtoms,
    details,
    height,
    id,
    onAtomClick,
    onBondClick,
    onMouseHover,
    onMouseLeave,
    smarts,
    smiles,
    alignmentDetails,
    style,
    showLoadingSpinner = false,
    showSmartsAsSmiles = false,
    width,
    zoomable = false,
    displayZoomToolbar = DisplayZoomToolbar.ON_HOVER,
    ...restOfProps
  }: MoleculeRepresentationProps) => {
    const { worker } = useRDKit();
    const moleculeRef: React.MutableRefObject<SVGElement | null> = useRef<SVGElement | null>(null);
    const [isMoleculeRefSet, setIsMoleculeRefSet] = useState(false);
    const [svgContent, setSvgContent] = useState('');
    const [atomsHitbox, setAtomsHitbox] = useState<Array<SVGRectElement>>([]);
    const [bondsHitbox, setBondsHitbox] = useState<SVGPathElement[]>([]);
    const [iconsCoords, setIconsCoords] = useState<IconCoords[]>([]);
    const isClickable = useMemo(() => !!onAtomClick || !!onBondClick, [onAtomClick, onBondClick]);
    const isHoverable = useMemo(() => !!onMouseHover || !!onMouseLeave, [onMouseHover, onMouseLeave]);
    const isClickableOrHoverable = useMemo(() => isClickable || isHoverable, [isClickable, isHoverable]);
    const [shouldComputeRectsDetails, setShouldComputeRectsDetails] = useState<{
      shouldComputeRects: boolean;
      computedRectsForAtoms: number[];
    }>({ shouldComputeRects: false, computedRectsForAtoms: [] });

    const computeClickingRects = useCallback(async () => {
      if (!worker) return;
      if (!isClickableOrHoverable) return;
      const structureToDraw = smiles || (smarts as string);
      const moleculeDetails = await getMoleculeDetails(worker, { smiles: structureToDraw });
      if (!moleculeDetails) return;
      const timeout = setTimeout(
        // do this a better way, the issue is when highlighting there is a moment when the atom-0 is rendered at the wrong position (0-0)
        () => {
          // Check if component is mounted before updating state
          if (moleculeRef?.current != null && isClickableOrHoverable) {
            buildAtomsHitboxes({
              numAtoms: moleculeDetails.numAtoms,
              parentDiv: moleculeRef.current,
              clickableAtoms: clickableAtoms?.clickableAtomsIds,
              isClickable: !!onAtomClick,
            }).then(setAtomsHitbox);
            buildBondsHitboxes({
              numAtoms: moleculeDetails.numAtoms,
              parentDiv: moleculeRef.current,
              isClickable: !!onBondClick,
            }).then(setBondsHitbox);
          }
        },
        100,
      );
      setShouldComputeRectsDetails({
        shouldComputeRects: false,
        computedRectsForAtoms:
          clickableAtoms && clickableAtoms.clickableAtomsIds && clickableAtoms.clickableAtomsIds.length
            ? clickableAtoms.clickableAtomsIds
            : [...Array(moleculeDetails.numAtoms).keys()],
      });
      return () => {
        clearTimeout(timeout);
      };
    }, [worker, onAtomClick, onBondClick, isClickableOrHoverable, smiles, smarts, clickableAtoms]);

    useEffect(() => {
      if (!shouldComputeRectsDetails.shouldComputeRects) return;
      computeClickingRects();
    }, [shouldComputeRectsDetails, computeClickingRects]);

    useEffect(() => {
      if (!attachedSvgIcons || !moleculeRef.current || !isMoleculeRefSet) {
        return;
      }
      computeIconsCoords({
        parentDiv: moleculeRef.current,
        attachedIcons: attachedSvgIcons,
      }).then(setIconsCoords);
    }, [attachedSvgIcons, isMoleculeRefSet]);

    useEffect(() => {
      if (!worker) return;
      const computeSvg = async () => {
        const drawingDetails: DrawSmilesSVGProps = {
          smiles: (smarts || smiles) as string,
          width,
          height,
          details: { ...details, addAtomIndices },
          alignmentDetails,
          atomsToHighlight,
          bondsToHighlight,
          isClickable,
          clickableAtoms,
        };
        const isSmartsAValidSmiles =
          showSmartsAsSmiles && !!smarts && (await isValidSmiles(worker, { smiles: smarts })).isValid;
        const svg =
          smarts && !isSmartsAValidSmiles
            ? await get_svg_from_smarts({ smarts, width, height }, worker)
            : await get_svg(drawingDetails, worker);
        if (!svg) return;
        const svgWithHitBoxes =
          atomsHitbox.length || bondsHitbox.length ? appendHitboxesToSvg(svg, atomsHitbox, bondsHitbox) ?? svg : svg;
        if (svgWithHitBoxes) {
          if (iconsCoords.length) {
            setSvgContent(appendSvgIconsToSvg(svgWithHitBoxes, iconsCoords) ?? svgWithHitBoxes);
          } else {
            setSvgContent(svgWithHitBoxes);
          }
        }
        setShouldComputeRectsDetails((prev) => {
          const shouldInitClickableRects = isClickableOrHoverable && !prev.computedRectsForAtoms.length;
          const areClickableRectsOutOfDate =
            isClickableOrHoverable &&
            clickableAtoms &&
            !isEqual(new Set(prev.computedRectsForAtoms), new Set(clickableAtoms.clickableAtomsIds));
          if (shouldInitClickableRects || areClickableRectsOutOfDate) {
            return { ...prev, shouldComputeRects: true };
          }
          return prev;
        });
      };
      computeSvg();
    }, [
      showSmartsAsSmiles,
      smiles,
      smarts,
      atomsHitbox,
      bondsHitbox,
      atomsToHighlight,
      addAtomIndices,
      details,
      isClickable,
      bondsToHighlight,
      width,
      height,
      worker,
      clickableAtoms,
      alignmentDetails,
      iconsCoords,
      isClickableOrHoverable,
    ]);

    const handleOnClick = useCallback(
      (event: React.MouseEvent) => {
        const clickedId = (event.target as SVGRectElement).id;
        if (isClickable) {
          event.preventDefault();
          event.stopPropagation();
        }
        if (onBondClick && clickedId && isIdClickedABond(clickedId)) {
          onBondClick(getClickedBondIdentifiersFromId(clickedId), event);
        }
        if (onAtomClick && clickedId && isIdClickedAnAtom(clickedId)) {
          onAtomClick(getAtomIdxFromClickableId(clickedId), event);
        }
      },
      [onAtomClick, onBondClick, isClickable],
    );
    const handleOnMouseHover = useCallback(
      (event: React.MouseEvent) => {
        if (!onMouseHover) {
          return;
        }
        const hoveredElementId = (event.target as SVGRectElement).id;
        onMouseHover(
          {
            atomId: isIdClickedAnAtom(hoveredElementId) ? getAtomIdxFromClickableId(hoveredElementId) : undefined,
            bondIdentifiers: isIdClickedABond(hoveredElementId)
              ? getClickedBondIdentifiersFromId(hoveredElementId)
              : undefined,
          },
          event,
        );
      },
      [onMouseHover],
    );
    const handleOnMouseLeave = useCallback(
      (event: React.MouseEvent) => {
        if (!onMouseLeave) {
          return;
        }
        onMouseLeave(event);
      },
      [onMouseLeave],
    );

    if (!svgContent) {
      if (showLoadingSpinner) return <Spinner width={width} height={height} />;
      return null;
    }

    const svgElement = createSvgElement(svgContent, {
      'data-testid': 'clickable-molecule',
      ref: (node: SVGElement) => {
        moleculeRef.current = node;
        setIsMoleculeRefSet(true);
      },
      ...restOfProps,
      className: `molecule ${isClickableOrHoverable ? CLICKABLE_MOLECULE_CLASSNAME : ''}`,
      height,
      id,
      onClick: handleOnClick,
      onMouseOver: handleOnMouseHover,
      onMouseLeave: handleOnMouseLeave,
      style,
      title: smiles,
      width,
    });

    return zoomable ? (
      <ZoomWrapper displayZoomToolbar={displayZoomToolbar} width={width} height={height}>
        {svgElement}
      </ZoomWrapper>
    ) : (
      svgElement
    );
  },
  (prevProps, currentPros) => isEqual(prevProps, currentPros),
);

MoleculeRepresentation.displayName = 'MoleculeRepresentation';
export default MoleculeRepresentation;

interface MoleculeRepresentationBaseProps {
  addAtomIndices?: boolean;
  atomsToHighlight?: number[][];
  bondsToHighlight?: number[][];
  attachedSvgIcons?: AttachedSvgIcon[];
  clickableAtoms?: ClickableAtoms;
  details?: Record<string, unknown>;
  height: number;
  id?: string;
  onAtomClick?: (atomId: string, event: React.MouseEvent) => void;
  onBondClick?: (clickedBondIdentifiers: BondIdentifiers, event: React.MouseEvent) => void;
  onMouseHover?: (
    { atomId, bondIdentifiers }: { atomId?: string; bondIdentifiers?: BondIdentifiers },
    event: React.MouseEvent,
  ) => void;
  onMouseLeave?: (event: React.MouseEvent) => void;
  style?: CSSProperties;
  showLoadingSpinner?: boolean;
  showSmartsAsSmiles?: boolean;
  width: number;
  /** Zoomable molecule with meta key + mouse wheel or toolbar */
  zoomable?: boolean;
  displayZoomToolbar?: DisplayZoomToolbarStrings;
}

interface SmilesRepresentationProps extends MoleculeRepresentationBaseProps {
  smarts?: never;
  smiles: string;
  alignmentDetails?: AlignmentDetails;
}

interface SmartsRepresentationProps extends MoleculeRepresentationBaseProps {
  smarts: string;
  smiles?: never;
  alignmentDetails?: never;
}

export interface AlignmentDetails {
  molBlock: string;
  highlightColor?: RDKitColor;
}
