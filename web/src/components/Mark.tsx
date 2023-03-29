import { memo, useMemo } from 'react';

import { Sprite, Container, Text } from '@pixi/react';
import { Texture, TextStyle } from 'pixi.js';

import { colors, fonts } from '@utils/tailwind';

function Mark({
  slot,
  slotsPerEpoch = 32,
  isEnd = false,
  showText = true,
  visible = true,
  x = 0,
  y = 0,
}: {
  slot: number;
  slotsPerEpoch?: number;
  isEnd?: boolean;
  showText?: boolean;
  visible?: boolean;
  x?: number;
  y?: number;
}) {
  const { width, height, epoch } = useMemo(
    () => ({
      width: isEnd ? 12 : 10,
      height: isEnd ? 1000 : 1000,
      epoch: slot % slotsPerEpoch === 0 ? Math.floor(slot / slotsPerEpoch) : undefined,
    }),
    [slot, slotsPerEpoch, isEnd, showText],
  );
  if (!visible) return null;

  return (
    <Container x={x} y={y - 500} data-testid="container">
      <>
        <Sprite
          texture={Texture.WHITE}
          tint={'#67e8f9'}
          alpha={0.1}
          anchor={0.5}
          position={{ x: x - width / 2, y: y - height / 2 }}
          rotation={Math.PI}
          height={height}
          width={width}
        />
        {showText && (
          <>
            {epoch && (
              <Text
                text={`EPOCH ${epoch}`}
                position={[x - width / 2 - 40, y - height / 2 + 435]}
                anchor={[-0.2, 13]}
                alpha={0.2}
                style={
                  new TextStyle({
                    align: 'center',
                    fontFamily: fonts.sans,
                    fontSize: 45,
                    fill: colors.stone[50],
                    wordWrap: false,
                  })
                }
              />
            )}
            <Text
              text={`SLOT ${slot}`}
              position={[x - width / 2 - 40, y - height / 2 - 450]}
              anchor={[-0.2, -13]}
              alpha={1}
              style={
                new TextStyle({
                  align: 'center',
                  fontFamily: fonts.sans,
                  fontSize: 45,
                  fill: colors.stone[600],
                  wordWrap: false,
                  dropShadowDistance: 0,
                  dropShadow: true,
                  dropShadowColor: colors.stone[900],
                  dropShadowBlur: 5,
                  dropShadowAlpha: 1,
                })
              }
            />
          </>
        )}
      </>
    </Container>
  );
}

export default memo(Mark);
