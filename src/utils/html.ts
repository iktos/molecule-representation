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
