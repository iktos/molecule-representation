import React, { useCallback, useMemo, useState } from 'react';

import { applyMatrixToPoint, Zoom } from '@visx/zoom';
import { TransformMatrix } from '@visx/zoom/lib/types';

import ZoomReset from '../../icons/ZoomReset';
import ZoomIn from '../../icons/ZoomIn';
import ZoomOut from '../../icons/ZoomOut';

export enum DisplayZoomToolbar {
  ON_HOVER = 'ON_HOVER',
  ALL_TIME = 'ALL_TIME',
  HIDE = 'HIDE',
}

export type DisplayZoomToolbarStrings = keyof typeof DisplayZoomToolbar;

interface ZoomWrapperProps {
  children: React.ReactNode;
  height: number;
  width: number;
  displayZoomToolbar: DisplayZoomToolbarStrings;
}

const ZoomWrapper: React.FC<ZoomWrapperProps> = ({ children, displayZoomToolbar, height, width }) => {
  const [hover, setHover] = useState(false);
  const displayToolbar = useMemo(() => {
    switch (displayZoomToolbar) {
      case DisplayZoomToolbar.ALL_TIME:
        return true;
      case DisplayZoomToolbar.ON_HOVER:
        return hover;
      case DisplayZoomToolbar.HIDE:
      default:
        return false;
    }
  }, [displayZoomToolbar, hover]);

  const constrain = useCallback(
    (transformMatrix: TransformMatrix, prevTransformMatrix: TransformMatrix) => {
      const min = applyMatrixToPoint(transformMatrix, { x: 0, y: 0 });
      const max = applyMatrixToPoint(transformMatrix, { x: width, y: height });
      if (max.x < width || max.y < height) {
        return prevTransformMatrix;
      }
      if (min.x > 0 || min.y > 0) {
        return prevTransformMatrix;
      }
      return transformMatrix;
    },
    [width, height],
  );
  return (
    <Zoom<SVGSVGElement> width={width} height={height} constrain={constrain}>
      {(zoom) => {
        const isZooming = zoom.transformMatrix.scaleX !== 1 && zoom.transformMatrix.scaleY !== 1;

        return (
          <div
            className='container'
            style={{
              position: 'relative',
              width,
              height,
            }}
            onMouseOver={() => {
              if (!hover) setHover(true);
            }}
            onMouseLeave={() => setHover(false)}
          >
            <svg className='svg-container' ref={zoom.containerRef} height={height} width={width}>
              <g
                onMouseDown={zoom.dragStart}
                onMouseLeave={() => {
                  if (zoom.isDragging) {
                    zoom.dragEnd();
                  }
                }}
                onMouseMove={zoom.dragMove}
                onMouseUp={zoom.dragEnd}
                onTouchEnd={zoom.dragEnd}
                onTouchMove={zoom.dragMove}
                onTouchStart={zoom.dragStart}
                onWheelCapture={(e) => {
                  // Bug when using ctrlKey
                  // https://github.com/airbnb/visx/issues/1638
                  if (!e.metaKey) {
                    e.stopPropagation();
                  }
                }}
                cursor={isZooming ? (zoom.isDragging ? 'grabbing' : 'grab') : undefined}
                height={height}
                style={{
                  touchAction: 'none',
                }}
                transform={zoom.toString()}
                width={width}
              >
                {children}
              </g>
            </svg>
            {displayToolbar && (
              <div
                style={{
                  borderRadius: '.25rem',
                  bottom: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '.25rem',
                  position: 'absolute',
                  right: '0.5rem',
                  zIndex: '100',
                }}
              >
                {isZooming && <ZoomReset cursor='pointer' onClick={zoom.reset} />}
                <ZoomIn cursor='pointer' onClick={() => zoom.scale({ scaleX: 1.2, scaleY: 1.2 })} />
                <ZoomOut cursor='pointer' onClick={() => zoom.scale({ scaleX: 0.8, scaleY: 0.8 })} />
              </div>
            )}
          </div>
        );
      }}
    </Zoom>
  );
};

export default ZoomWrapper;
