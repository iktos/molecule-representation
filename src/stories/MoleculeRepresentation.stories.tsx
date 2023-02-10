import { Meta, Story } from '@storybook/react';
import { useArgs } from '@storybook/client-api';
import React from 'react';

import {
  MoleculeRepresentation,
  MoleculeRepresentationProps,
} from '../components/MoleculeRepresentation/MoleculeRepresentation';
import { RDKitProvider } from '@iktos-oss/rdkit-provider';

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
  <RDKitProvider cache={{ enableJsMolCaching: true, maxJsMolsCached: 30 }}>
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
    <RDKitProvider cache={{ enableJsMolCaching: true, maxJsMolsCached: 30 }}>
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

export const BigClickableMolecule = TemplateWithOnAtomClick.bind({});
BigClickableMolecule.args = {
  ...PROPS,
  smiles:
    'Oc7c(O)cc%21c(c7O)-c6c(O)c(O)c(O)cc6C(=O)OCC(C(OC%21=O)C%15OC(=O)c(cc%16O)c-4c(O)c%16O)OC(C%15OC(=O)c(c-4c%23O)cc(O)c%23O)Oc(c1O)c(c(c(O)c1O)-c(c%10O)c%13cc(O)c%10O)C(=O)OC%11C(COC%13=O)OC(C(OC(=O)c(cc(O)c%19O)c(c%19O)-c%12c8O)C%11OC(=O)c%12cc(O)c8O)OC(=O)c(cc%20O)cc(c%20O)Oc(c(O)c(O)c3O)c%18c3-c5c(O)c(O)c(O)cc5C(=O)OCC(OC(OC(=O)c(cc%22O)cc(O)c%22O)C%17OC(=O)c%14cc(O)c2O)C(OC%18=O)C%17OC(=O)c9cc(O)c(O)c(O)c9-c%14c2O',
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
