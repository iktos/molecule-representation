# molecule-representation

Interactif molecule represnetations as react components

#### usage

wrap your components in an RDKit provider from [@iktos-oss/rdkit-provider](https://github.com/iktos/rdkit-provider)

```html
import { RDKitProvider } from '@iktos-oss/rdkit-provider';
<RDKitProvider>
  <Component />
</RDKitProvider>
```

render molecule

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

launch storybook to see all available options

```bash
    npm install
    npm run storybook
```
