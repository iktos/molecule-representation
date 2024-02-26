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
import { ClickedBondIdentifiers } from '../utils';
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

  const onBondClick = (identifiers: ClickedBondIdentifiers) => {
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
  const onBondClick = (identifiers: ClickedBondIdentifiers) => {
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
      <MoleculeRepresentation {...args} onAtomClick={onAtomClick} onBondClick={onBondClick} />
    </RDKitProvider>
  );
};

const TemplateWithOnBondAndOnAtomClickAndPopup: Story<MoleculeRepresentationProps> = (args) => {
  // or use event.target as anchor instead of position
  const [popup, setPopup] = useState({ show: false, content: <></>, position: { x: 0, y: 0 } });

  const onBondClick = (identifiers: ClickedBondIdentifiers, event: React.MouseEvent) => {
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
    smarts: '[#6][CH1](=O)',
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
