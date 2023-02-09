/* eslint-disable no-var */

import { JSMol } from '@rdkit/rdkit';

export {};

declare global {
  var jsMolCache: Record<string, JSMol> | null;
}
