/* 
  MIT License

  Copyright (c) 2023 Iktos

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
*/

import { IconCoords } from './svg-computation';

export const appendHitboxesToSvg = (
  svg: string,
  atomsHitboxes: SVGEllipseElement[],
  bondsHitBoxes: SVGPathElement[],
) => {
  const temp = document.createElement('div');
  temp.innerHTML = svg;
  const svgParsed = temp.getElementsByTagName('svg')[0];
  if (!svgParsed) return;
  for (const bondHitBox of bondsHitBoxes) {
    svgParsed.appendChild(bondHitBox);
  }
  for (const atomHitbox of atomsHitboxes) {
    svgParsed.appendChild(atomHitbox);
  }
  return temp.innerHTML;
};

export const createHitboxFromAtomEllipse = ({
  ellipse,
  id,
  isClickable,
}: {
  ellipse: SVGEllipseElement;
  id: string;
  isClickable: boolean;
}) => {
  const pathCopy = ellipse.cloneNode(true) as SVGEllipseElement;
  pathCopy.id = id;
  pathCopy.style.stroke = 'transparent';
  pathCopy.style.fill = 'transparent';
  if (isClickable) {
    pathCopy.style.cursor = 'pointer';
  }
  return pathCopy;
};

export const createHitboxPathFromPath = ({
  path,
  id,
  isClickable,
}: {
  path: SVGPathElement;
  id: string;
  isClickable: boolean;
}) => {
  const pathCopy = path.cloneNode(true) as SVGPathElement;
  pathCopy.id = id;
  pathCopy.style.stroke = 'transparent';
  pathCopy.style.strokeWidth = '20px';
  if (isClickable) {
    pathCopy.style.cursor = 'pointer';
  }
  return pathCopy;
};

export const getSvgDimensionsWithAppendedElements = (svg: string) => {
  const temp = document.createElement('div');
  temp.innerHTML = svg;
  const svgParsed = temp.getElementsByTagName('svg')[0];
  if (!svgParsed) return null;

  const widthStr = svgParsed.getAttribute('width');
  const heightStr = svgParsed.getAttribute('height');

  if (!widthStr) {
    return null;
  }
  if (!heightStr) {
    return null;
  }
  const width = parseFloat(widthStr);
  const height = parseFloat(heightStr);
  temp.innerHTML = '';

  return { width, height };
};
export const getPathEdgePoints = (path: SVGPathElement) => {
  const length = path.getTotalLength();
  return {
    start: path.getPointAtLength(0),
    end: path.getPointAtLength(length),
    length,
  };
};

export const appendSvgIconsToSvg = (svg: string, iconsCoords: IconCoords[]) => {
  const temp = document.createElement('div');
  temp.innerHTML = svg;
  const svgParsed = temp.getElementsByTagName('svg')[0];
  if (!svgParsed) return;

  for (const iconCoord of iconsCoords) {
    const parser = new DOMParser();
    const iconSvg = parser.parseFromString(iconCoord.svg, 'image/svg+xml').documentElement;

    for (const placement of iconCoord.placements) {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute(
        'transform',
        `scale(${iconCoord.scale}) translate(${placement.xTranslate / iconCoord.scale}, ${
          placement.yTranslate / iconCoord.scale
        })`,
      );
      g.setAttribute('pointer-events', 'none');
      g.appendChild(iconSvg.cloneNode(true));
      svgParsed.appendChild(g);
    }
  }

  return temp.innerHTML;
};
