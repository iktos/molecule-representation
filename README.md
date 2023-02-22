# molecule-representation

React components for interactive 2D molecule representation rendering.

## Usage

#### Initial setup  

Wrap your components in an RDKit provider from [@iktos-oss/rdkit-provider](https://github.com/iktos/rdkit-provider)

```html
import { RDKitProvider } from '@iktos-oss/rdkit-provider';
<RDKitProvider>
  <Component />
</RDKitProvider>`
```

For better preformance we recommend enabling the caching of rdkitjs JsMol instances, this can be done using RDKitProvider
```html
import { RDKitProvider } from '@iktos-oss/rdkit-provider';
<RDKitProvider  cache={{ enableJsMolCaching: true, maxJsMolsCached: 30 }}>
  <Component />
</RDKitProvider>`
```

#### Rendering molecules

```js
import { MoleculeRepresentation, MoleculeRepresentationProps } from '@iktos-oss/molecule-representation';
const props: MoleculeRepresentationProps = {
  smiles: 'Cc1cccc(-c2ccccc2)c1',
  addAtomIndices: true,
  bondsToHighlight: [
    [1, 0],
    [3, 4],
  ],
  atomsToHighlight: [
    [1, 0],
    [3, 4],
  ],
  height: 200,
  width: 300,
  onAtomClick: (atomId: string) => console.log(atomId),
};
<MoleculeRepresentation {...props} onAtomClick={} />
```

## Demo  

Run the storybook locally to see all available options.

```bash
    npm install
    npm run storybook
```  
