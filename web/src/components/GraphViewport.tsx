import { useContext, useEffect, useRef, Ref } from 'react';

import { useApp } from '@pixi/react';
import debounce from 'lodash/debounce';
import { Viewport as V } from 'pixi-viewport';

import Viewport from '@components/Viewport';
import { ViewportContext } from '@components/ViewportContext';

const MyViewport = ({
  width,
  height,
  maxWidth,
  maxHeight,
  children,
}: {
  width: number;
  height: number;
  maxWidth: number;
  maxHeight: number;
  children: (v?: V | null) => JSX.Element;
}) => {
  const app = useApp();
  const ctx = useContext(ViewportContext);
  const viewportRef = useRef<V>(null);

  useEffect(() => {
    if (viewportRef.current && ctx) {
      viewportRef.current.on(
        'moved',
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        debounce<unknown>(() => {
          if (viewportRef.current) {
            ctx.setViewportBox({
              corner: viewportRef.current.corner,
              worldScreenWidth: viewportRef.current.worldScreenWidth,
              worldScreenHeight: viewportRef.current.worldScreenHeight,
            });
          }
        }, 100),
      );
      ctx.setViewport(viewportRef.current);
    }
  }, [ctx?.setViewport, ctx?.setViewportBox]);

  return app ? (
    <Viewport
      app={app}
      ref={viewportRef}
      width={width}
      height={height}
      maxHeight={maxHeight}
      maxWidth={maxWidth}
    >
      {children(viewportRef.current)}
    </Viewport>
  ) : null;
};

export default MyViewport;
