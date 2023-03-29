import { useCallback, useState, memo, useMemo } from 'react';

import { Graphics, Container, Text } from '@pixi/react';
import {
  Graphics as PixiGraphics,
  Circle,
  FederatedEventHandler,
  FederatedPointerEvent,
  TextStyle,
} from 'pixi.js';

import { arcToRadiansByPercentage } from '@utils/maths';
import { truncateHash } from '@utils/strings';
import { colors, fonts } from '@utils/tailwind';

function WeightedNode({
  validity,
  hash,
  weight,
  weightPercentageComparedToHeaviestNeighbor,
  type,
  visible = true,
  x = 0,
  y = 0,
  radius = 200,
  borderWidth = 20,
  onPointerTap,
  onPointerEnter,
  onPointerLeave,
}: {
  validity: 'valid' | string;
  hash: string;
  weight: string;
  weightPercentageComparedToHeaviestNeighbor: number;
  type: 'canonical' | 'fork' | 'finalized' | 'justified';
  visible?: boolean;
  x?: number;
  y?: number;
  radius?: number;
  borderWidth?: number;
  onPointerTap?: FederatedEventHandler<FederatedPointerEvent>;
  onPointerEnter?: FederatedEventHandler<FederatedPointerEvent>;
  onPointerLeave?: FederatedEventHandler<FederatedPointerEvent>;
}) {
  const [isHighlighted, setIsHighlighted] = useState(false);

  const outline = useMemo(() => {
    if (validity !== 'valid') return 'rose';

    switch (type) {
      case 'canonical':
        return 'emerald';
      case 'fork':
        return 'amber';
      case 'finalized':
        return 'fuchsia';
      case 'justified':
        return 'indigo';
      default:
        return 'emerald';
    }
  }, [type, validity]);

  function handlePointerEnter(e: FederatedPointerEvent) {
    if (onPointerEnter) onPointerEnter(e);
    setIsHighlighted(true);
  }
  function handlePointerLeave(e: FederatedPointerEvent) {
    if (onPointerLeave) onPointerLeave(e);
    setIsHighlighted(false);
  }

  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.lineStyle(0);
      g.beginFill(colors.stone[800], 1);
      g.drawCircle(0, 0, radius);
      g.endFill();
      g.beginFill(isHighlighted ? colors.stone[600] : colors.stone[700], 1);
      g.drawCircle(0, 0, radius - borderWidth);
      g.endFill();
      g.lineStyle(4, colors[outline][800]);
      if (weightPercentageComparedToHeaviestNeighbor >= 100) {
        g.drawCircle(0, 0, radius - borderWidth - 2);
      } else {
        g.arc(
          0,
          0,
          radius - borderWidth - 2,
          -Math.PI / 2, // pixijs starts at 3 o'clock
          arcToRadiansByPercentage(-Math.PI / 2, weightPercentageComparedToHeaviestNeighbor),
        );
      }
      // move to top
      g.moveTo(0, -radius + borderWidth / 2);
      g.lineStyle(borderWidth, colors[outline][600]);
      if (weightPercentageComparedToHeaviestNeighbor >= 100) {
        g.drawCircle(0, 0, radius - borderWidth / 2);
      } else {
        g.arc(
          0,
          0,
          radius - borderWidth / 2,
          -Math.PI / 2, // pixijs starts at 3 o'clock
          arcToRadiansByPercentage(-Math.PI / 2, weightPercentageComparedToHeaviestNeighbor),
        );
      }

      g.eventMode = 'static';
      g.hitArea = new Circle(0, 0, radius);
      g.onpointerenter = handlePointerEnter;
      g.onpointerleave = handlePointerLeave;
      if (onPointerTap) {
        g.onpointertap = onPointerTap;
      }
    },
    [{ visible, isHighlighted, onPointerTap }],
  );

  if (!visible) return null;

  return (
    <Container x={x} y={y} data-testid="container">
      <>
        <Graphics data-testid="graphics" draw={draw} />
        <Text
          text={
            validity !== 'valid'
              ? 'INVALID'
              : ['finalized', 'justified'].includes(type)
              ? type.toUpperCase()
              : 'VALID'
          }
          position={[0, 0]}
          anchor={[0.5, 3]}
          style={
            new TextStyle({
              align: 'center',
              fontFamily: fonts.mono,
              fontSize: 25,
              fill: colors.stone[50],
              wordWrap: false,
            })
          }
        />
        <Text
          text={truncateHash(hash)}
          position={[0, 0]}
          anchor={[0.5, 0.5]}
          style={
            new TextStyle({
              align: 'center',
              fontFamily: fonts.mono,
              fontSize: 35,
              fill: colors.stone[50],
              wordWrap: false,
            })
          }
        />
        {weight && weight !== '0' && (
          <Text
            text={weight}
            position={[0, 0]}
            anchor={[0.5, weight.length > 22 ? -4 : -2]}
            style={
              new TextStyle({
                align: 'center',
                fontFamily: fonts.mono,
                fontSize: weight.length > 22 ? 15 : 25,
                fill: colors.stone[50],
                wordWrap: false,
              })
            }
          />
        )}
      </>
    </Container>
  );
}

export default memo(WeightedNode);
