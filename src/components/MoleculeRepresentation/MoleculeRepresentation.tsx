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

import React, { CSSProperties, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { RDKitColor, getMoleculeDetails, isValidSmiles, useRDKit } from '@iktos-oss/rdkit-provider';
import { ZoomWrapper, DisplayZoomToolbar, DisplayZoomToolbarStrings } from '../Zoom';
import { Spinner } from '../Spinner';
import { isEqual } from '../../utils/compare';
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
  AttachedSvgIcon,
  computeIconsCoords,
  appendSvgIconsToSvg,
  createSvgElement,
  AtomsStyles,
  BondsStyles,
  applyUserStyles,
} from '../../utils';

export type MoleculeRepresentationProps = SmilesRepresentationProps | SmartsRepresentationProps;

export const MoleculeRepresentation: React.FC<MoleculeRepresentationProps> = memo(
  ({
    addAtomIndices = false,
    atomsToHighlight,
    highlightColor,
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
    canonicalize = false,
    width,
    zoomable = false,
    displayZoomToolbar = DisplayZoomToolbar.ON_HOVER,
    heatmapAtomsWeights,
    atomsStyles,
    bondsStyles,
    ...restOfProps
  }: MoleculeRepresentationProps) => {
    const { worker } = useRDKit();
    const [svgContent, setSvgContent] = useState('');
    const isClickable = useMemo(() => !!onAtomClick || !!onBondClick, [onAtomClick, onBondClick]);
    const isHoverable = useMemo(() => !!onMouseHover || !!onMouseLeave, [onMouseHover, onMouseLeave]);
    const isClickableOrHoverable = useMemo(() => isClickable || isHoverable, [isClickable, isHoverable]);

    useEffect(() => {
      // the compute svg effect
      if (!worker) return;
      const computeSvg = async () => {
        const structureToDraw = (smarts || smiles) as string;
        if (!structureToDraw) return;
        const drawingDetails: DrawSmilesSVGProps = {
          smiles: structureToDraw,
          width,
          height,
          details: { ...details, addAtomIndices },
          alignmentDetails,
          highlightColor,
          atomsToHighlight,
          bondsToHighlight,
          heatmapAtomsWeights,
          isClickable,
          clickableAtoms,
          canonicalize,
        };
        const isSmartsAValidSmiles =
          showSmartsAsSmiles && !!smarts && (await isValidSmiles(worker, { smiles: smarts })).isValid;
        let svg = smarts
          ? await get_svg_from_smarts({ smarts, width, height }, isSmartsAValidSmiles, worker)
          : await get_svg(drawingDetails, worker);
        if (!svg) return;
        if (smarts) {
          // effects are not yet supported for smarts, only compute/add effects for smiles
          setSvgContent(svg);
          return;
        }

        // add effects to svg
        const moleculeDetails = await getMoleculeDetails(worker, {
          smiles: structureToDraw,
          returnFullDetails: true,
        });
        if (!moleculeDetails) return;
        svg = applyUserStyles({
          svg,
          numAtoms: moleculeDetails.NumHeavyAtoms,
          atomsStyles,
          bondsStyles,
        });
        if (isClickableOrHoverable) {
          const atomsHitbox = buildAtomsHitboxes({
            numAtoms: moleculeDetails.NumHeavyAtoms,
            svg,
            clickableAtoms: clickableAtoms?.clickableAtomsIds ? new Set(clickableAtoms.clickableAtomsIds) : null,
            isClickable: !!onAtomClick,
          });
          const bondsHitbox = buildBondsHitboxes({
            numAtoms: moleculeDetails.NumHeavyAtoms,
            svg,
            isClickable: !!onBondClick,
          });
          svg =
            atomsHitbox.length || bondsHitbox.length
              ? (appendHitboxesToSvg(svg, atomsHitbox, bondsHitbox) ?? svg)
              : svg;
        }
        if (attachedSvgIcons) {
          const svgWithEllipsesToUseForIconScale = await get_svg(
            { ...drawingDetails, generateClickableHotspots: true },
            worker,
          );
          const iconsCoords = computeIconsCoords({
            svg: svgWithEllipsesToUseForIconScale ?? svg,
            attachedIcons: attachedSvgIcons,
          });
          svg = appendSvgIconsToSvg(svg, iconsCoords) ?? svg;
        }
        setSvgContent(svg);
      };
      computeSvg();
    }, [
      showSmartsAsSmiles,
      smiles,
      smarts,
      onAtomClick,
      onBondClick,
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
      isClickableOrHoverable,
      heatmapAtomsWeights,
      highlightColor,
      attachedSvgIcons,
      atomsStyles,
      bondsStyles,
      canonicalize,
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
  highlightColor?: RDKitColor;
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
  heatmapAtomsWeights?: Record<number, number>;
  atomsStyles?: AtomsStyles;
  bondsStyles?: BondsStyles;
  canonicalize?: boolean;
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
