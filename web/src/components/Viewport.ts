import { Ref } from 'react';

import { PixiComponent } from '@pixi/react';
import { Viewport } from 'pixi-viewport';
import { Application, ICanvas } from 'pixi.js';

const calculateClamp = (width: number, height: number, maxWidth: number) => {
  const verticalClamp = height > width ? 30000 : 20000;
  return {
    left: -5000,
    right: maxWidth + 5000,
    top: -verticalClamp,
    bottom: verticalClamp,
    underflow: 'none',
  };
};

type Props = {
  width: number;
  height: number;
  maxWidth: number;
  maxHeight: number;
  app: Application<ICanvas>;
  ref?: Ref<Viewport> | null;
  children?: React.ReactNode;
};

export default PixiComponent<Props, Viewport>('Viewport', {
  applyProps: (viewport, _, newProps) => {
    viewport.resize(newProps.width, newProps.height, newProps.maxWidth, newProps.maxHeight);
    viewport.clamp(calculateClamp(newProps.width, newProps.height, newProps.maxWidth));
  },

  create: (props) => {
    const viewport = new Viewport({
      screenWidth: props.width,
      screenHeight: props.height,
      ticker: props.app.ticker,
      events: props.app.renderer.events,
    });

    viewport
      .drag({ clampWheel: true })
      .clamp(calculateClamp(props.width, props.height, props.maxWidth))
      .pinch()
      .wheel({ smooth: 3 })
      .decelerate()
      .clampZoom({
        minWidth: 1000,
        minHeight: 1000,
        maxWidth: 50000,
        maxHeight: 50000,
      });
    return viewport;
  },
});
