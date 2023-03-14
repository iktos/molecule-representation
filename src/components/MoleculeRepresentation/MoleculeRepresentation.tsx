import React, { CSSProperties, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getMoleculeDetails, useRDKit } from '@iktos-oss/rdkit-provider';
import { ClickableAtoms, DrawSmilesSVGProps, get_svg, get_svg_from_smarts } from '../../utils/draw';
import { appendRectsToSvg, Rect } from '../../utils/html';

import {
  CLICKABLE_MOLECULE_CLASSNAME,
  computeClickingAreaForAtoms,
  getAtomIdxFromClickableId,
} from './MoleculeRepresentation.service';
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
    ...restOfProps
  }: MoleculeRepresentationProps) => {
    const { worker } = useRDKit();
    const moleculeRef = useRef<HTMLDivElement>(null);
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [smiles, smarts, isClickable, clickableAtoms]);

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
        const svg = smarts
          ? await get_svg_from_smarts({ smarts, width, height }, worker)
          : await get_svg(drawingDetails, worker);
        if (!svg) return;
        const svhWithHitBoxes = appendRectsToSvg(svg, rects);
        if (svhWithHitBoxes) {
          setSvgContent(svhWithHitBoxes);
        }
        if (!rects.length) {
          setShouldComputeRects(true);
        }
      };
      computeSvg();
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
      worker,
      clickableAtoms,
      alignmentDetails,
    ]);

    if (!svgContent) return <Spinner width={width} height={height} />;

    return (
      <div
        data-testid='clickable-molecule'
        ref={moleculeRef}
        {...restOfProps}
        className={`molecule ${onAtomClick ? CLICKABLE_MOLECULE_CLASSNAME : ''}`}
        dangerouslySetInnerHTML={{ __html: svgContent }}
        id={id}
        onClick={(e) => {
          const clickedId = (e.target as HTMLDivElement).id;
          if (onAtomClick && clickedId) {
            e.preventDefault();
            e.stopPropagation();
            const atomIdx = getAtomIdxFromClickableId(clickedId);
            onAtomClick(atomIdx);
          }
        }}
        style={{ ...style, height, width }}
      ></div>
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
