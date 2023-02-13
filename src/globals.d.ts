/* eslint-disable no-var */
import { RDKitProviderGlobals } from '@iktos-oss/rdkit-provider';

export {};

declare global {
  var rdkitProviderGlobals: RDKitProviderGlobals;
}
