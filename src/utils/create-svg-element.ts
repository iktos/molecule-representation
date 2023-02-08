import { cloneElement } from 'react';
import convert from 'react-from-dom';

type SVGProps = {
  ref: React.Ref<SVGElement>;
  [props: string]: unknown;
};

export const createSvgElement = (svg: string, svgProps?: SVGProps) => {
  if (!svg) throw new Error('Missing svg');

  const element = convert(svg);

  if (!element) throw new Error('Could not convert to element');

  return cloneElement(element as React.ReactElement, { ...svgProps });
};
