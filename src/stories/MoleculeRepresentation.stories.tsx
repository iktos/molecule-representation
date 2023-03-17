import { Meta, Story } from '@storybook/react';
import { useArgs } from '@storybook/client-api';
import React from 'react';

import {
  MoleculeRepresentation,
  MoleculeRepresentationProps,
} from '../components/MoleculeRepresentation/MoleculeRepresentation';
import { RDKitProvider } from '@iktos-oss/rdkit-provider';
import { BIG_MOLECULE, MOLECULES, RANOLAZINE_SMILES, SEVEN_HIGHLIGHTS_RANOLAZINE } from './fixtures/molecules';
import { RDKitColor } from '../constants';
import { CCO_MOL_BLOCK, SMILES_TO_ALIGN_CCO_AGAINST } from './fixtures/molblock';
import { RDKitProviderProps } from '@iktos-oss/rdkit-provider';

export default {
  title: 'components/molecules/MoleculeRepresentation',
  component: MoleculeRepresentation,
} as Meta;

const PROPS: MoleculeRepresentationProps = {
  smiles: 'Cc1cccc(-c2ccccc2)c1',
  height: 200,
  width: 300,
  onAtomClick: undefined,
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

export const Clickable = TemplateWithOnAtomClick.bind({});
Clickable.args = {
  ...PROPS,
};

export const BigClickableMoleculeWithLoadingSpinner = TemplateWithOnAtomClick.bind({});
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
