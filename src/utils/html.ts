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

export interface Rect {
  height: number;
  id: string;
  width: number;
  x: number;
  y: number;
}

export const isElementInParentBySelector = (selector: string, parent: SVGElement) => !!parent.querySelector(selector);

export const waitForChildFromParent = (selector: string, parent: SVGElement) => {
  return new Promise((resolve) => {
    if (parent.querySelector(selector)) {
      return resolve(parent.querySelectorAll(selector));
    }
    const timeout = setTimeout(() => {
      observer.disconnect();
      resolve([]);
    }, 100);

    const observer = new MutationObserver((_) => {
      if (parent.querySelector(selector)) {
        clearTimeout(timeout);
        resolve(parent.querySelectorAll(selector));
        observer.disconnect();
      }
    });

    observer.observe(parent, {
      childList: true,
      subtree: true,
    });
  });
};

export const appendRectsToSvg = (svg: string, rects: Rect[]) => {
  const temp = document.createElement('div');
  temp.innerHTML = svg;
  const svgParsed = temp.getElementsByTagName('svg')[0];
  if (!svgParsed) return;
  for (const rect of rects) {
    // @ts-ignore
    const rectElem = document.createElementNS(svgParsed.attributes['xmlns'].nodeValue, 'rect');
    rectElem.setAttribute('fill', 'transparent');
    rectElem.setAttribute('x', rect.x.toString());
    rectElem.setAttribute('y', rect.y.toString());
    rectElem.setAttribute('width', rect.width.toString());
    rectElem.setAttribute('height', rect.height.toString());
    rectElem.id = rect.id;
    rectElem.style.cursor = 'pointer';
    svgParsed.appendChild(rectElem);
  }

  return temp.innerHTML;
};

export const getPathEdgePoints = (path: SVGPathElement) => {
  const length = path.getTotalLength();
  return {
    start: path.getPointAtLength(0),
    end: path.getPointAtLength(length),
    length,
  };
};
