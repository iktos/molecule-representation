import { Meta, Story } from '@storybook/react';
import { useArgs } from '@storybook/client-api';
import React from 'react';

import { MoleculeRepresentation, MoleculeRepresentationProps } from './MoleculeRepresentation';
import { RDKitProvider } from '../../contexts';

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

const Template: Story<MoleculeRepresentationProps> = (args) => (
  <RDKitProvider>
    <MoleculeRepresentation {...args} />
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
    <RDKitProvider>
      <MoleculeRepresentation {...args} onAtomClick={onAtomClick} />
    </RDKitProvider>
  );
};

export const Default = Template.bind({});
Default.args = PROPS;

export const HighlightedAtoms = Template.bind({});
HighlightedAtoms.args = {
  ...PROPS,
  atomsToHighlight: [
    [1, 0],
    [3, 4],
  ],
};

export const HighlightedBonds = Template.bind({});
HighlightedBonds.args = {
  ...PROPS,
  bondsToHighlight: [
    [1, 0],
    [3, 4],
  ],
};

export const WithIndices = Template.bind({});
WithIndices.args = {
  ...PROPS,
  addAtomIndices: true,
};

export const FromSmarts = Template.bind({});
FromSmarts.args = {
  ...PROPS,
  smarts: undefined,
  smiles: '****CO',
};

export const Clickable = TemplateWithOnAtomClick.bind({});
Clickable.args = {
  ...PROPS,
};

export const ClickableSetOfAtoms = TemplateWithOnAtomClick.bind({});
ClickableSetOfAtoms.args = {
  ...PROPS,
  clickableAtoms: {
    clickableAtomsIds: [0, 1, 2, 3, 6, 7, 9, 12, 4],
    clickableAtomsBackgroundColor: [53 / 256, 141 / 256, 231 / 256, 0.5],
  },
};
