import React, { CSSProperties, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SVG from 'react-inlinesvg';
import { getMoleculeDetails, isValidSmiles, useRDKit } from '@iktos-oss/rdkit-provider';
import { ClickableAtoms, DrawSmilesSVGProps, get_svg, get_svg_from_smarts } from '../../utils/draw';
import { appendRectsToSvg, Rect } from '../../utils/html';

import {
  CLICKABLE_MOLECULE_CLASSNAME,
  computeClickingAreaForAtoms,
  getAtomIdxFromClickableId,
} from './MoleculeRepresentation.service';
import ZoomWrapper, { DisplayZoomToolbar, DisplayZoomToolbarStrings } from '../Zoom/ZoomWrapper';
import { Spinner } from '../Spinner';
import { RDKitColor } from '../../constants';
import { isEqual } from '../../utils/compare';
import { createSvgElement } from '../../utils/create-svg-element';

export type MoleculeRepresentationProps = SmilesRepresentationProps | SmartsRepresentationProps;

export const MoleculeRepresentation: React.FC<MoleculeRepresentationProps> = memo(
  ({
    addAtomIndices = false,
    atomsToHighlight,
    bondsToHighlight,
    clickableAtoms,
    details,
    height,
    id,
    onAtomClick,
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
    const moleculeRef = useRef<SVGElement>(null);
    const [svgContent, setSvgContent] = useState('');
    const [rects, setRects] = useState<Array<Rect>>([]);
    const isClickable = useMemo(() => !!onAtomClick, [onAtomClick]);
    const [shouldComputeRects, setShouldComputeRects] = useState(false);

    const computeClickingRects = useCallback(async () => {
      if (!worker) return;
      if (!isClickable) return;
      const structureToDraw = smiles || (smarts as string);
      const moleculeDetails = await getMoleculeDetails(worker, { smiles: structureToDraw });
      if (!moleculeDetails) return;
      setTimeout(
        // do this a better way, the issue is when highlighting there is a moment when the atom-0 is rendered at the wrong position (0-0)
        () => {
          computeClickingAreaForAtoms({
            numAtoms: moleculeDetails.numAtoms,
            parentDiv: moleculeRef.current,
            clickableAtoms: clickableAtoms?.clickableAtomsIds,
          }).then(setRects);
        },
        100,
      );
      setShouldComputeRects(false);
    }, [smiles, smarts, isClickable, clickableAtoms, worker]);

    useEffect(() => {
      if (!shouldComputeRects) return;
      computeClickingRects();
    }, [shouldComputeRects, computeClickingRects]);

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
        const svgWithHitBoxes = rects.length ? appendRectsToSvg(svg, rects) : svg;
        if (svgWithHitBoxes) {
          setSvgContent(svgWithHitBoxes);
        }
        if (!rects.length && isClickable) {
          setShouldComputeRects(true);
        }
      };
      computeSvg();
    }, [
      showSmartsAsSmiles,
      smiles,
      smarts,
      rects,
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
    ]);

    const handleOnClick = useCallback(
      (e: React.MouseEvent) => {
        const clickedId = (e.target as SVGRectElement).id;
        if (onAtomClick && clickedId) {
          e.preventDefault();
          e.stopPropagation();
          const atomIdx = getAtomIdxFromClickableId(clickedId);
          onAtomClick(atomIdx);
        }
      },
      [onAtomClick],
    );

    if (showLoadingSpinner && !svgContent) return <Spinner width={width} height={height} />;

    const svgElement = createSvgElement(svgContent, {
      'data-testid': 'clickable-molecule',
      ref: moleculeRef,
      ...restOfProps,
      className: `molecule ${onAtomClick ? CLICKABLE_MOLECULE_CLASSNAME : ''}`,
      height,
      id,
      onClick: handleOnClick,
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
  clickableAtoms?: ClickableAtoms;
  details?: Record<string, unknown>;
  height: number;
  id?: string;
  onAtomClick?: (atomId: string) => void;
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
