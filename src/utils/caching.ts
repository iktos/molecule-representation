import { MAX_CACHED_MOLECULES_SVGS } from '../constants';

export const storeMoleculeSvgCache = (params: Record<string, unknown>, svg: string) => {
  const key = getCacheKey(params);
  const nbCachedMolecules = Object.keys(globalThis.moleculeRepresentationSVGCache ?? {}).length;
  if (!globalThis.moleculeRepresentationSVGCache || nbCachedMolecules > MAX_CACHED_MOLECULES_SVGS) {
    globalThis.moleculeRepresentationSVGCache = { [key]: svg };
    return;
  }
  globalThis.moleculeRepresentationSVGCache[key] = svg;
};

export const getMoleculeSvgFromCache = (params: Record<string, unknown>) => {
  if (!globalThis.moleculeRepresentationSVGCache) {
    return null;
  }
  const key = getCacheKey(params);
  return globalThis.moleculeRepresentationSVGCache[key];
};

const getCacheKey = (params: Record<string, unknown>): string => {
  return JSON.stringify(deepSortObject(params));
};

const deepSortObject = (params: Record<string, unknown>) => {
  const sortedObject: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      sortedObject[key] = value.slice().flat().sort();
    } else if (typeof value === 'object' && value !== null) {
      sortedObject[key] = deepSortObject(sortObject(value as Record<string, unknown>));
    } else {
      sortedObject[key] = value;
    }
  }

  return sortObject(sortedObject);
};

const sortObject = (obj: Record<string, unknown>) =>
  // most browsers would sort objects based on entry order
  Object.keys(obj)
    .sort()
    .reduce((acc: Record<string, unknown>, key) => {
      acc[key] = (obj as Record<string, unknown>)[key];
      return acc;
    }, {});
