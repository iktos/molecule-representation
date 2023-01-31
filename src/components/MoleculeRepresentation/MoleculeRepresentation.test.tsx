import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { RDKitProvider } from '@iktos-oss/rdkit-provider';
import MoleculeRepresentation, { MoleculeRepresentationProps } from './MoleculeRepresentation';

const baseProps: MoleculeRepresentationProps = {
  smiles: 'Cc1cccc(-c2ccccc2)c1',
  height: 200,
  width: 300,
};

describe('<MoleculeRepresentation />', () => {
  test('it should render with base props', async () => {
    const { container } = render(
      <RDKitProvider>
        <MoleculeRepresentation {...baseProps} />
      </RDKitProvider>,
    );
    await screen.findAllByTestId('clickable-molecule');
    await waitFor(() => expect(container.querySelector('svg')).toBeTruthy());
    const svgElem = container.querySelector('svg');
    expect(svgElem).toBeTruthy();
  });
});
