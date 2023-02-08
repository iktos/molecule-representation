import React, { CSSProperties, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SVG from 'react-inlinesvg';

import { useRDKit } from '@iktos-oss/rdkit-provider';
import { ClickableAtoms, DrawSmilesSVGProps, get_svg, get_svg_from_smarts } from '../../utils/draw';
import { appendRectsToSvg, Rect } from '../../utils/html';
import { get_molecule_details, is_valid_smiles } from '../../utils/molecule';

import {
  CLICKABLE_MOLECULE_CLASSNAME,
  computeClickingAreaForAtoms,
  getAtomIdxFromClickableId,
} from './MoleculeRepresentation.service';
import ZoomWrapper, { DisplayZoomToolbar, DisplayZoomToolbarStrings } from '../../zoom/ZoomWrapper';
import { Spinner } from '../Spinner';
import { RDKitColor } from '../../constants';

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
    width,
    zoomable = false,
    displayZoomToolbar = DisplayZoomToolbar.ON_HOVER,
    ...restOfProps
  }: MoleculeRepresentationProps) => {
    const { RDKit } = useRDKit();
    const moleculeRef = useRef<SVGElement>(null);
    const [svgContent, setSvgContent] = useState('');
    const [rects, setRects] = useState<Array<Rect>>([]);
    const isClickable = useMemo(() => !!onAtomClick, [onAtomClick]);

    useEffect(() => {
      if (!RDKit) return;
      if (!isClickable) return;
      const structureToDraw = smiles || (smarts as string);
      const moleculeDetails = get_molecule_details(structureToDraw, RDKit);
      if (!moleculeDetails) return;
      setTimeout(
        // do this a better way, the issue is when highlighting there is a moment when the atom-0 is rendered at the wrong position (0-0)
        () =>
          computeClickingAreaForAtoms({
            numAtoms: moleculeDetails.numAtoms,
            parentDiv: moleculeRef.current,
            clickableAtoms: clickableAtoms?.clickableAtomsIds,
          }).then(setRects),
        100,
      );
    }, [smiles, smarts, RDKit, isClickable, clickableAtoms]);

    useEffect(() => {
      if (!RDKit) return;
      const drawingDetails: DrawSmilesSVGProps = {
        smiles: smarts || (smiles as string),
        width,
        height,
        details: { ...details, addAtomIndices },
        alignmentDetails,
        atomsToHighlight,
        bondsToHighlight,
        isClickable,
        clickableAtoms,
      };
      setTimeout(() => {
        // put workload in a settimeout 0 to avoid blocking the main thread when rendering lots of molecules
        const svg = smarts
          ? is_valid_smiles(smarts, RDKit)
            ? get_svg(drawingDetails, RDKit)
            : get_svg_from_smarts({ smarts, width, height }, RDKit)
          : get_svg(drawingDetails, RDKit);
        if (svg) setSvgContent(appendRectsToSvg(svg, rects));
      }, 0);
    }, [
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
      RDKit,
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

    if (!svgContent) return <Spinner width={width} height={height} />;

    const content = (
      <SVG
        data-testid='clickable-molecule'
        innerRef={moleculeRef}
        {...restOfProps}
        cacheRequests={false}
        className={`molecule ${onAtomClick ? CLICKABLE_MOLECULE_CLASSNAME : ''}`}
        height={height}
        id={id}
        onClick={handleOnClick}
        src={svgContent}
        style={{ ...style }}
        title={smiles}
        width={width}
      />
    );

    return zoomable ? (
      <ZoomWrapper displayZoomToolbar={displayZoomToolbar} width={width} height={height}>
        {content}
      </ZoomWrapper>
    ) : (
      content
    );
  },
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
