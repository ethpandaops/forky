import { useMemo } from 'react';

import { Sprite } from '@pixi/react';
import { IPointData, Texture } from 'pixi.js';

export default function Edge({
  source,
  target,
  visible = true,
  width = 10,
}: {
  source: IPointData;
  target: IPointData;
  visible?: boolean;
  width?: number;
}) {
  const { position, rotation, height } = useMemo(() => {
    return {
      position: { x: (source.x + target.x) / 2, y: (source.y + target.y) / 2 },
      rotation: -Math.atan2(target.x - source.x, target.y - source.y),
      height: Math.hypot(target.x - source.x, target.y - source.y),
    };
  }, [source, target]);

  if (!visible) return null;
  return (
    <>
      <Sprite
        texture={Texture.WHITE}
        tint={0x404040}
        alpha={0.9}
        anchor={0.5}
        position={{ ...position, y: position.y - width * 0.2 }}
        rotation={rotation}
        height={height}
        width={width}
      />
      <Sprite
        texture={Texture.WHITE}
        tint={0x404040}
        alpha={0.9}
        anchor={0.5}
        position={{ ...position, y: position.y + width * 0.2 }}
        rotation={rotation}
        height={height}
        width={width}
      />
      <Sprite
        texture={Texture.WHITE}
        anchor={0.5}
        position={position}
        rotation={rotation}
        height={height}
        width={width}
      />
    </>
  );
}
