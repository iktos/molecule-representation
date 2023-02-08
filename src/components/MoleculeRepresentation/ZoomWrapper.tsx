import React, { useCallback, useEffect, useReducer, useRef } from 'react';
import ZoomIn from '../icons/ZoomIn';
import ZoomOut from '../icons/ZoomOut';

interface ZoomEvent {
  delta: number;
  mouseX: number | undefined;
  mouseY: number | undefined;
  scale: number;
  zoom: boolean;
}

type ZoomWrapperProps = React.PropsWithChildren<{
  height: number;
  showZoomCircle: boolean;
  width: number;
}>;

const ZoomWrapper: React.FC<ZoomWrapperProps> = ({ children, height, width, showZoomCircle }) => {
  const [zoomEvent, setZoomEvent] = useReducer(
    (prev: ZoomEvent, next: Partial<ZoomEvent>) => {
      const newZoomEvent = { ...prev, ...next };

      if (prev.delta !== newZoomEvent.delta)
        newZoomEvent.scale = newZoomEvent.delta > 0 ? newZoomEvent.scale * 1.2 : newZoomEvent.scale / 1.2;

      return newZoomEvent;
    },
    {
      delta: -1,
      mouseX: undefined,
      mouseY: undefined,
      scale: 1,
      zoom: false,
    },
  );

  const imageRef = useRef<HTMLDivElement>(null);

  const handleMouseOver = useCallback(() => {
    setZoomEvent({ zoom: true });
  }, []);

  const handleMouseOut = useCallback(() => {
    setZoomEvent({ zoom: false, scale: 1 });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!imageRef.current) return;
    const { left, top } = imageRef.current.getBoundingClientRect();

    const {
      current: {
        style: { height, width },
      },
    } = imageRef;

    setZoomEvent({
      mouseX: ((e.clientX - left) / parseInt(width, 10)) * 100,
      mouseY: ((e.clientY - top) / parseInt(height, 10)) * 100,
    });
  }, []);

  const handleOnWheel = useCallback((e: React.WheelEvent) => {
    if (!e.ctrlKey) return;
    setZoomEvent({ delta: -e.deltaY });
    e.preventDefault();
  }, []);

  useEffect(() => {
    if (!imageRef.current) return;
    if (imageRef) {
      imageRef.current.addEventListener('wheel', handleOnWheel);
      const _cur = imageRef.current;

      return () => {
        _cur.removeEventListener('wheel', handleOnWheel);
      };
    }
  }, [handleOnWheel, imageRef]);

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseOver={handleMouseOver}
      onMouseLeave={handleMouseOut}
      style={{
        alignItems: 'center',
        display: 'flex',
        height: `${height || 200}px`,
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        width: `${width || 250}px`,
      }}
      ref={imageRef}
    >
      <div
        style={{
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'auto 100%',
          height: `${height}px`,
          transform: `scale(${zoomEvent.scale})`,
          transformOrigin: `${zoomEvent.mouseX}% ${zoomEvent.mouseY}%`,
          transition: `transform 0.5s ease-out`,
          willChange: 'transform',
        }}
      >
        {children}
      </div>
      {showZoomCircle && (
        <div
          style={{
            background: '#e1eeff87',
            border: '6px ridge #2b82ff66',
            borderRadius: '50%',
            display: zoomEvent.zoom ? 'block' : 'none',
            height: `${(1 / zoomEvent.scale) * 2}rem`,
            left: `calc(${zoomEvent.mouseX}% - ${1 / zoomEvent.scale / 2}rem)`,
            position: 'absolute',
            top: `calc(${zoomEvent.mouseY}% - ${1 / zoomEvent.scale / 2}rem)`,
            width: `${(1 / zoomEvent.scale) * 2}rem`,
          }}
        />
      )}
      {zoomEvent.zoom && (
        <div
          style={{
            bottom: '0.5rem',
            position: 'absolute',
            right: '0.5rem',
            zIndex: '100',
          }}
        >
          {zoomEvent.delta > 0 && <ZoomIn />}
          {zoomEvent.delta <= 0 && <ZoomOut />}
        </div>
      )}
    </div>
  );
};

export default ZoomWrapper;
