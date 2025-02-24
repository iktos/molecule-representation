﻿/* 
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

import { Meta, Story } from '@storybook/react';
import { useArgs } from '@storybook/client-api';
import React, { useState } from 'react';

import {
  MoleculeRepresentation,
  MoleculeRepresentationProps,
} from '../components/MoleculeRepresentation/MoleculeRepresentation';
import { RDKitColor, RDKitProvider } from '@iktos-oss/rdkit-provider';
import { BIG_MOLECULE, MOLECULES, RANOLAZINE_SMILES, SEVEN_HIGHLIGHTS_RANOLAZINE } from './fixtures/molecules';
import { CCO_MOL_BLOCK, SMILES_TO_ALIGN_CCO_AGAINST } from './fixtures/molblock';
import { RDKitProviderProps } from '@iktos-oss/rdkit-provider';
import { BondIdentifiers } from '../utils';
import Popup from './fixtures/Popup';

export default {
  title: 'components/molecules/MoleculeRepresentation',
  component: MoleculeRepresentation,
} as Meta;

const PROPS: MoleculeRepresentationProps = {
  smiles: 'Cc1cccc(-c2ccccc2)c1',
  height: 200,
  width: 300,
  onAtomClick: undefined,
  onBondClick: undefined,
  zoomable: false,
};

const RDKitProviderCachingProps: RDKitProviderProps = {
  cache: { enableJsMolCaching: true, maxJsMolsCached: 50 },
};

const Template: Story<{
  moleculeRepresetnationProps: MoleculeRepresentationProps;
  rdkitProviderProps: RDKitProviderProps;
}> = ({
  moleculeRepresetnationProps,
  rdkitProviderProps,
}: {
  moleculeRepresetnationProps: MoleculeRepresentationProps;
  rdkitProviderProps: RDKitProviderProps;
}) => (
  <RDKitProvider {...rdkitProviderProps}>
    <MoleculeRepresentation {...moleculeRepresetnationProps} />
  </RDKitProvider>
);

const TemplateOfListOfMoleculesRepresentations: Story<{
  listOfSmiles: string[];
  listOfProps: MoleculeRepresentationProps[];
}> = ({ listOfSmiles, listOfProps }: { listOfSmiles: string[]; listOfProps: MoleculeRepresentationProps[] }) => (
  <RDKitProvider {...RDKitProviderCachingProps}>
    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
      {listOfSmiles.map((smiles, idx) => (
        // eslint-disable-next-line react/jsx-key
        <div style={{ width: '25%' }}>
          <MoleculeRepresentation {...listOfProps[idx]} smiles={smiles} smarts={undefined} />
        </div>
      ))}
    </div>
  </RDKitProvider>
);

const TemplateWithOnAtomClick: Story<MoleculeRepresentationProps> = (args) => {
  const [_, updateArgs] = useArgs();

  const onAtomClick = (atomId: string) => {
    const clickedAtomId = parseInt(atomId);
    if (args.atomsToHighlight?.flat().includes(clickedAtomId)) {
      updateArgs({
        ...args,
        atomsToHighlight: args.atomsToHighlight.map((highlightedAtomsColor) =>
          highlightedAtomsColor.filter((id) => id !== clickedAtomId),
        ),
      });
    } else {
      updateArgs({
        ...args,
        atomsToHighlight: !args.atomsToHighlight
          ? [[clickedAtomId]]
          : args.atomsToHighlight.map((highlightedAtomsColor, colorIdx) => {
              if (colorIdx === 0) {
                return [...highlightedAtomsColor, clickedAtomId];
              }
              return highlightedAtomsColor;
            }),
      });
    }
  };
  return (
    <RDKitProvider {...RDKitProviderCachingProps}>
      <MoleculeRepresentation {...args} onAtomClick={onAtomClick} />
    </RDKitProvider>
  );
};
const TemplateWithOnBondClick: Story<MoleculeRepresentationProps> = (args) => {
  const [_, updateArgs] = useArgs();

  const onBondClick = (identifiers: BondIdentifiers) => {
    const clickedBondId = parseInt(identifiers.bondId);
    if (args.bondsToHighlight?.flat().includes(clickedBondId)) {
      updateArgs({
        ...args,
        bondsToHighlight: args.bondsToHighlight.map((highlightedBondssColor) =>
          highlightedBondssColor.filter((id) => id !== clickedBondId),
        ),
      });
    } else {
      updateArgs({
        ...args,
        bondsToHighlight: !args.bondsToHighlight
          ? [[clickedBondId]]
          : args.bondsToHighlight.map((highlightedBondssColor, colorIdx) => {
              if (colorIdx === 0) {
                return [...highlightedBondssColor, clickedBondId];
              }
              return highlightedBondssColor;
            }),
      });
    }
  };
  return (
    <RDKitProvider {...RDKitProviderCachingProps}>
      <MoleculeRepresentation {...args} onBondClick={onBondClick} />
    </RDKitProvider>
  );
};

const TemplateWithOnAtomAndBondClick: Story<MoleculeRepresentationProps> = (args) => {
  const [_, updateArgs] = useArgs();
  const [hoveredAtomId, setHoveredAtomId] = useState<number | null>(null);
  const [hoveredBondId, setHoveredBondId] = useState<number | null>(null);

  const onAtomClick = (atomId: string) => {
    setHoveredAtomId(null);
    const clickedAtomId = parseInt(atomId);
    if (args.atomsToHighlight?.flat().includes(clickedAtomId)) {
      updateArgs({
        ...args,
        atomsToHighlight: args.atomsToHighlight.map((highlightedAtomsColor) =>
          highlightedAtomsColor.filter((id) => id !== clickedAtomId),
        ),
      });
    } else {
      updateArgs({
        ...args,
        atomsToHighlight: !args.atomsToHighlight
          ? [[clickedAtomId]]
          : args.atomsToHighlight.map((highlightedAtomsColor, colorIdx) => {
              if (colorIdx === 0) {
                return [...highlightedAtomsColor, clickedAtomId];
              }
              return highlightedAtomsColor;
            }),
      });
    }
  };
  const onBondClick = (identifiers: BondIdentifiers) => {
    setHoveredBondId(null);
    const clickedBondId = parseInt(identifiers.bondId);
    if (args.bondsToHighlight?.flat().includes(clickedBondId)) {
      updateArgs({
        ...args,
        bondsToHighlight: args.bondsToHighlight.map((highlightedBondssColor) =>
          highlightedBondssColor.filter((id) => id !== clickedBondId),
        ),
      });
    } else {
      updateArgs({
        ...args,
        bondsToHighlight: !args.bondsToHighlight
          ? [[clickedBondId]]
          : args.bondsToHighlight.map((highlightedBondssColor, colorIdx) => {
              if (colorIdx === 0) {
                return [...highlightedBondssColor, clickedBondId];
              }
              return highlightedBondssColor;
            }),
      });
    }
  };
  const onMouseHover = (
    {
      atomId,
      bondIdentifiers,
    }: {
      atomId?: string;
      bondIdentifiers?: BondIdentifiers;
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    event: React.MouseEvent,
  ) => {
    if (!atomId && !bondIdentifiers) {
      setHoveredAtomId(null);
      setHoveredBondId(null);
    }
    if (atomId) {
      setHoveredBondId(null);
      setHoveredAtomId(parseInt(atomId));
    }
    if (bondIdentifiers) {
      setHoveredAtomId(null);
      setHoveredBondId(parseInt(bondIdentifiers.bondId));
    }
  };
  const onMouseLeave = () => {
    setHoveredAtomId(null);
    setHoveredBondId(null);
  };

  const isHoveredAtomInClickedAtoms =
    hoveredAtomId !== null && args.atomsToHighlight?.some((atomHighlight) => atomHighlight.includes(hoveredAtomId));
  const isHoveredBondInClickedAtoms =
    hoveredBondId !== null && args.bondsToHighlight?.some((bondHighlight) => bondHighlight.includes(hoveredBondId));
  return (
    <RDKitProvider {...RDKitProviderCachingProps}>
      <MoleculeRepresentation
        {...args}
        atomsToHighlight={[
          ...(args.atomsToHighlight ? args.atomsToHighlight : [[]]),
          hoveredAtomId !== null && !isHoveredAtomInClickedAtoms ? [hoveredAtomId] : [],
        ]}
        bondsToHighlight={[
          ...(args.bondsToHighlight ? args.bondsToHighlight : [[]]),
          hoveredBondId !== null && !isHoveredBondInClickedAtoms ? [hoveredBondId] : [],
        ]}
        onAtomClick={onAtomClick}
        onBondClick={onBondClick}
        onMouseHover={onMouseHover}
        onMouseLeave={onMouseLeave}
      />
    </RDKitProvider>
  );
};

const TemplateWithOnBondAndOnAtomClickAndPopup: Story<MoleculeRepresentationProps> = (args) => {
  // or use event.target as anchor instead of position
  const [popup, setPopup] = useState({ show: false, content: <></>, position: { x: 0, y: 0 } });

  const onBondClick = (identifiers: BondIdentifiers, event: React.MouseEvent) => {
    const clickedBondId = parseInt(identifiers.bondId);
    const rect = (event.target as HTMLElement).getBoundingClientRect();

    const content = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div>Bond {clickedBondId} clicked:</div> <div>Start atom id: {identifiers.startAtomId}</div>
        <div>End atom id: {identifiers.endAtomId}</div>
      </div>
    );
    setPopup({
      show: true,
      content: content,
      // or use event.target as anchor instead
      position: { x: rect.left + window.scrollX, y: rect.top + window.scrollY },
    });
  };

  const onAtomClick = (atomId: string, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();

    const content = <div>Atom {atomId} clicked</div>;
    setPopup({
      show: true,
      content: content,
      position: { x: rect.left + window.scrollX, y: rect.top + window.scrollY },
    });
  };

  const handleClosePopup = () => {
    setPopup((prev) => ({ ...prev, show: false }));
  };

  return (
    <RDKitProvider {...RDKitProviderCachingProps}>
      <div style={{ position: 'relative' }}>
        <MoleculeRepresentation {...args} onBondClick={onBondClick} onAtomClick={onAtomClick} />
        <Popup visible={popup.show} content={popup.content} position={popup.position} onClose={handleClosePopup} />
      </div>
    </RDKitProvider>
  );
};

export const Default = Template.bind({});
Default.args = { moleculeRepresetnationProps: PROPS, rdkitProviderProps: RDKitProviderCachingProps };

export const CoordgenPreferred = Template.bind({});
CoordgenPreferred.args = {
  moleculeRepresetnationProps: PROPS,
  rdkitProviderProps: { ...RDKitProviderCachingProps, preferCoordgen: true },
};

export const HighlightedAtoms = Template.bind({});
HighlightedAtoms.args = {
  moleculeRepresetnationProps: {
    ...PROPS,
    atomsToHighlight: [
      [1, 0],
      [3, 4],
    ],
  },
  rdkitProviderProps: RDKitProviderCachingProps,
};

export const HighlightedBonds = Template.bind({});
HighlightedBonds.args = {
  moleculeRepresetnationProps: {
    ...PROPS,
    bondsToHighlight: [
      [1, 0],
      [3, 4],
    ],
  },
  rdkitProviderProps: RDKitProviderCachingProps,
};

export const MoleculeWithAtomsHeatmap = Template.bind({});
MoleculeWithAtomsHeatmap.args = {
  moleculeRepresetnationProps: {
    ...PROPS,
    heatmapAtomsWeights: { 1: 3, 2: 1, 0: 0.5, 5: 5 },
    highlightColor: [1, 0.435, 0, 0.5],
  },
  rdkitProviderProps: RDKitProviderCachingProps,
};

export const WithCustomStyles = Template.bind({});
WithCustomStyles.args = {
  moleculeRepresetnationProps: {
    ...PROPS,
    smiles: 'CC1=C(C(=CC=C1)C)NC(=O)CN2CCN(CC2)CC(COC3=CC=CC=C3OC)O',
    atomsStyles: {
      default: { opacity: 0.2 },
      13: { opacity: 1 },
      14: { opacity: 1 },
      15: { opacity: 1 },
      16: { opacity: 1 },
      17: { opacity: 1 },
      18: { opacity: 1 },
      19: { opacity: 1 },
      29: { opacity: 1 },
      30: { opacity: 1 },
    },
    bondsStyles: {
      default: { opacity: 0.2 },
      '*-13': { opacity: 1 },
      '*-14': { opacity: 1 },
      '*-15': { opacity: 1 },
      '*-16': { opacity: 1 },
      '*-17': { opacity: 1 },
      '*-18': { opacity: 1 },
      '*-19': { opacity: 1 },
      '*-29': { opacity: 1 },
      '*-30': { opacity: 1 },
      '13-*': { opacity: 1 },
      '14-*': { opacity: 1 },
      '15-*': { opacity: 1 },
      '16-*': { opacity: 1 },
      '17-*': { opacity: 1 },
      '18-*': { opacity: 1 },
      '19-*': { opacity: 1 },
      '29-*': { opacity: 1 },
      '30-*': { opacity: 1 },
    },
  },
  rdkitProviderProps: RDKitProviderCachingProps,
};
export const AtomsWithCustomStyles = Template.bind({});
AtomsWithCustomStyles.args = {
  moleculeRepresetnationProps: {
    ...PROPS,
    smiles: 'OOOOOOOOO',
    atomsStyles: { default: { fill: 'green', opacity: 0.5 }, 2: { fill: 'yellow' } },
  },
  rdkitProviderProps: RDKitProviderCachingProps,
};
export const BondsWithCustomStyles = Template.bind({});
BondsWithCustomStyles.args = {
  moleculeRepresetnationProps: {
    ...PROPS,
    smiles: 'OOOOOOOOOOOOOO',
    bondsStyles: {
      default: { stroke: 'green' },
      2: { stroke: 'black', 'stroke-width': '3px' },
      '5-6': { opacity: 0.6, stroke: 'yellow' },
      '7-*': { 'stroke-width': '3px' },
      '*-10': { 'stroke-width': '4px' },
      '10-*': { 'stroke-width': '2px' },
    },
  },
  rdkitProviderProps: RDKitProviderCachingProps,
};

export const AtomsWithCustomSVGIcons = Template.bind({});
AtomsWithCustomSVGIcons.args = {
  moleculeRepresetnationProps: {
    ...PROPS,
    attachedSvgIcons: [
      {
        svg: '<?xml version="1.0" encoding="UTF-8" standalone="no"?>    <svg       xmlns:dc="http://purl.org/dc/elements/1.1/"       xmlns:cc="http://creativecommons.org/ns#"       xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"       xmlns:svg="http://www.w3.org/2000/svg"       xmlns="http://www.w3.org/2000/svg"       xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"       xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"       width="1000px"       height="1000px"       viewBox="0 0 1000 1000"       version="1.1"       id="svg2"       inkscape:version="0.48.4 r9939"       sodipodi:docname="edit-cut.svg">      <metadata         id="metadata11">        <rdf:RDF>          <cc:Work             rdf:about="">            <dc:format>image/svg+xml</dc:format>            <dc:type               rdf:resource="http://purl.org/dc/dcmitype/StillImage" />          </cc:Work>        </rdf:RDF>      </metadata>      <defs         id="defs9" />      <sodipodi:namedview         pagecolor="#ffffff"         bordercolor="#666666"         borderopacity="1"         objecttolerance="10"         gridtolerance="10"         guidetolerance="10"         inkscape:pageopacity="0"         inkscape:pageshadow="2"         inkscape:window-width="1280"         inkscape:window-height="985"         id="namedview7"         showgrid="false"         inkscape:zoom="0.236"         inkscape:cx="116.52542"         inkscape:cy="502.11864"         inkscape:window-x="-2"         inkscape:window-y="16"         inkscape:window-maximized="1"         inkscape:current-layer="svg2" />      <path         id="path5"         d="m 188.59375,20.5625 c -41.9739,25.386468 -41.9363,82.30052 -39.58035,125.68133 7.16328,84.36486 69.36316,147.92745 116.48231,213.41185 43.80497,56.06746 89.43881,110.67704 135.59804,164.81307 -19.52083,23.96875 -39.04167,47.9375 -58.5625,71.90625 -73.59618,-17.17683 -141.83587,30.81882 -186.27934,85.05329 -46.46909,50.91774 -91.788688,124.35222 -60.508997,194.53235 32.385377,82.17639 135.850017,121.60056 215.949337,86.16651 76.85816,-32.00841 134.03287,-101.74018 165.26521,-177.36945 23.65403,-38.59641 -4.38972,-87.69494 -1.48831,-118.83988 15.14832,-23.22823 30.19455,-33.85669 45.33087,-4.26627 18.20114,27.33365 -24.52119,71.74861 -2.15455,108.89548 24.0083,74.26128 77.10818,139.98902 144.24637,179.71738 73.62266,45.36336 181.7133,26.59969 227.65484,-48.93183 C 931.68015,846.11349 914.43834,770.2591 874.3541,719.78746 828.07096,656.94488 763.67222,587.33082 678.25827,593.50017 654.13719,605.63693 645.74177,578.90898 631.92526,564.99767 620.91892,551.47762 609.91259,537.95756 598.90625,524.4375 680.00105,426.60618 766.08272,331.244 830.25675,221.02132 855.85493,165.70711 862.11803,96.69521 834.03092,41.149106 820.59144,12.889789 803.8261,23.054165 792.66856,43.446399 695.10196,163.2976 597.53535,283.1488 499.96875,403 396.17425,275.52314 292.40248,148.02776 188.59375,20.5625 z M 186.125,58.1875 C 290.73217,186.68311 395.39914,315.13012 499.96875,443.65625 604.57709,315.16158 709.19895,186.67792 813.8125,58.1875 c 28.59676,66.96359 6.73768,145.90514 -37.27079,201.11417 -64.80768,92.51367 -137.95159,178.8028 -211.01046,264.82333 27.3726,33.66473 54.79372,67.29 82.1875,100.9375 60.43539,-21.82579 122.88104,12.71794 162.38655,57.55394 42.65209,46.80434 95.46125,108.67093 73.69002,176.74145 C 858.71565,932.91864 767.81648,969.87468 697.62151,938.17427 625.88594,907.69842 572.44899,841.36538 545.09375,769.6875 532.60911,736.72152 539.0616,697.45432 565.625,673.28125 c -22.05023,-24.4384 -43.90363,-49.05402 -65.59375,-73.8125 -21.74523,24.70852 -43.48093,49.42827 -65.625,73.78125 35.38937,31.29995 31.08882,84.49057 10.00453,122.6644 -39.92551,76.23289 -109.9766,153.70798 -202.64033,153.42186 -77.32244,0.70053 -153.182172,-80.45752 -124.95187,-158.08019 24.72899,-61.99109 71.15024,-115.73319 126.4486,-152.74783 32.18032,-20.33536 72.89002,-25.51261 109.04532,-13.44569 27.34638,-33.67754 54.79964,-67.26824 82.15625,-100.9375 C 351.1499,424.4786 264.1063,326.64978 195.90625,215.6875 171.53797,168.26961 164.68558,107.842 186.125,58.1875 z m 489.5625,614.34375 c -47.41998,-4.12622 -79.36335,47.44784 -66.03426,90.39445 15.34441,62.16278 66.23701,115.74592 126.95195,135.42811 48.76378,15.21967 101.54806,-31.22597 90.88918,-81.99813 C 816.63649,743.99255 749.8688,676.79222 675.6875,672.53125 z m -351.40625,0.0313 c -76.43123,5.21861 -143.681,73.38336 -152.27409,148.8103 -8.15542,54.13166 53.29775,95.85591 101.43034,73.9397 59.46731,-25.67092 111.89425,-81.43618 118.93985,-147.77314 4.97977,-40.65385 -26.74113,-77.63886 -68.0961,-74.97686 z m -0.1875,25.65625 c 56.19247,-1.75863 48.73137,72.64041 22.64417,102.77799 -25.88443,35.89502 -63.16781,74.4713 -110.47975,74.28536 -48.46873,-8.66916 -45.66996,-71.25212 -21.33905,-102.78736 23.46541,-37.90747 63.09581,-71.54805 109.17463,-74.27599 z m 351.78125,0 c 65.12146,6.37585 123.10326,66.69779 126.60182,132.07325 -0.0395,47.12716 -62.08963,57.59628 -91.72994,28.273 -42.19759,-29.47593 -84.98785,-77.4615 -75.80747,-132.63037 4.23704,-18.25442 22.98865,-28.82381 40.93559,-27.71588 z"         inkscape:connector-curvature="0"         sodipodi:nodetypes="cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc" />    </svg>',
        atomIds: [9],
        bondIds: [4, 5],
      },
      {
        svg: '<?xml version="1.0" encoding="iso-8859-1"?>        <!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->        <svg fill="#000000" height="800px" width="800px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"            viewBox="0 0 330 330" xml:space="preserve">        <g id="XMLID_509_">          <path id="XMLID_510_" d="M65,330h200c8.284,0,15-6.716,15-15V145c0-8.284-6.716-15-15-15h-15V85c0-46.869-38.131-85-85-85            S80,38.131,80,85v45H65c-8.284,0-15,6.716-15,15v170C50,323.284,56.716,330,65,330z M180,234.986V255c0,8.284-6.716,15-15,15            s-15-6.716-15-15v-20.014c-6.068-4.565-10-11.824-10-19.986c0-13.785,11.215-25,25-25s25,11.215,25,25            C190,223.162,186.068,230.421,180,234.986z M110,85c0-30.327,24.673-55,55-55s55,24.673,55,55v45H110V85z"/>        </g>        </svg>',
        atomIds: [0, 1],
        bondIds: [10],
      },
    ],
  },
  rdkitProviderProps: RDKitProviderCachingProps,
};

export const WithIndices = Template.bind({});
WithIndices.args = {
  moleculeRepresetnationProps: {
    ...PROPS,
    addAtomIndices: true,
  },
  rdkitProviderProps: RDKitProviderCachingProps,
};

export const FromSmarts = Template.bind({});
FromSmarts.args = {
  moleculeRepresetnationProps: {
    ...PROPS,
    smarts: '[Br,Cl,I][C&X4;C&H1,C&H2]',
    smiles: undefined,
    alignmentDetails: undefined,
  },
  rdkitProviderProps: RDKitProviderCachingProps,
};

export const FromSmartsWithExplicitHydronges = Template.bind({});
FromSmartsWithExplicitHydronges.args = {
  moleculeRepresetnationProps: {
    ...PROPS,
    smarts: 'C1([H])C([H])C([H])C([H])C([H])C1[H]',
    smiles: undefined,
    alignmentDetails: undefined,
  },
  rdkitProviderProps: { removeHs: false },
};

export const DrawSmartsAsSmiles = Template.bind({});
DrawSmartsAsSmiles.args = {
  moleculeRepresetnationProps: {
    ...PROPS,
    smarts: '[#6][CH1](=O)',
    showSmartsAsSmiles: true,
    smiles: undefined,
    alignmentDetails: undefined,
  },
  rdkitProviderProps: RDKitProviderCachingProps,
};

export const Zoomable = Template.bind({});
Zoomable.args = {
  moleculeRepresetnationProps: {
    ...PROPS,
    zoomable: true,
  },
  rdkitProviderProps: RDKitProviderCachingProps,
};

const alignmentHighlightColor: RDKitColor = [0.2, 0.8, 0.7, 0.7];
export const WithSubstructureAlignmentTemplate = TemplateOfListOfMoleculesRepresentations.bind({});
WithSubstructureAlignmentTemplate.args = {
  listOfProps: [
    {
      ...PROPS,
      alignmentDetails: { molBlock: CCO_MOL_BLOCK, highlightColor: alignmentHighlightColor },
    },
    {
      ...PROPS,
      alignmentDetails: { molBlock: CCO_MOL_BLOCK, highlightColor: alignmentHighlightColor },
    },
    {
      ...PROPS,
      alignmentDetails: { molBlock: CCO_MOL_BLOCK },
    },
    {
      ...PROPS,
      alignmentDetails: { molBlock: CCO_MOL_BLOCK, highlightColor: alignmentHighlightColor },
    },
    { ...PROPS },
    { ...PROPS },
    { ...PROPS },
    { ...PROPS },
  ],
  listOfSmiles: SMILES_TO_ALIGN_CCO_AGAINST,
};

export const ClickableAtoms = TemplateWithOnAtomClick.bind({});
ClickableAtoms.args = {
  ...PROPS,
};

export const ClickableBonds = TemplateWithOnBondClick.bind({});
ClickableBonds.args = {
  ...PROPS,
};

export const ClickableBondsAndAtoms = TemplateWithOnAtomAndBondClick.bind({});
ClickableBondsAndAtoms.args = {
  ...PROPS,
};

export const BigClickableMoleculeWithLoadingSpinner = TemplateWithOnAtomAndBondClick.bind({});
BigClickableMoleculeWithLoadingSpinner.args = {
  ...PROPS,
  width: 800,
  height: 800,
  smiles: BIG_MOLECULE,
  showLoadingSpinner: true,
};

export const ClickableSetOfAtoms = TemplateWithOnAtomClick.bind({});
ClickableSetOfAtoms.args = {
  ...PROPS,
  addAtomIndices: true,
  clickableAtoms: {
    clickableAtomsIds: [0, 1, 2, 3, 6, 7, 9, 12, 4],
    clickableAtomsBackgroundColor: [53 / 256, 141 / 256, 231 / 256, 0.5],
  },
};

export const WithOnClickPopup = TemplateWithOnBondAndOnAtomClickAndPopup.bind({});
WithOnClickPopup.args = {
  ...PROPS,
  addAtomIndices: true,
};

export const ThousandMolecules = TemplateOfListOfMoleculesRepresentations.bind({});
ThousandMolecules.args = {
  listOfSmiles: MOLECULES,
  listOfProps: Array(MOLECULES.length)
    .fill(null)
    .map(() => ({ ...PROPS, showLoadingSpinner: true })),
};

export const SevenHundredHighlightsForRanolazine = TemplateOfListOfMoleculesRepresentations.bind({});
SevenHundredHighlightsForRanolazine.args = {
  listOfSmiles: Array(SEVEN_HIGHLIGHTS_RANOLAZINE.length)
    .fill(null)
    .map(() => RANOLAZINE_SMILES),
  listOfProps: Array(SEVEN_HIGHLIGHTS_RANOLAZINE.length)
    .fill(null)
    .map((_, idx) => ({ ...PROPS, atomsToHighlight: [SEVEN_HIGHLIGHTS_RANOLAZINE[idx]] })),
};
