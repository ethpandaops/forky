import { useEffect, memo } from 'react';

import { Stage, Text } from '@pixi/react';
import { useQuery } from '@tanstack/react-query';
import { TextStyle } from 'pixi.js';

import GraphViewport from '@app/components/GraphViewport';
import useActiveFrame from '@app/hooks/useActiveFrame';
import { ForkChoiceData, Response, V1GetFrameResponse } from '@app/types/api';
import Edge from '@components/Edge';
import Mark from '@components/Mark';
import { ViewportProvider } from '@components/ViewportContext';
import WeightedNode from '@components/WeightedNode';
import useFrames from '@contexts/frames';
import useFrame from '@hooks/useFrame';
import useWeightedGraph from '@hooks/useWeightedGraph';
import { equalForkChoiceData } from '@utils/api';
import { colors, fonts } from '@utils/tailwind';

const fetchFrameData = async (id: string): Promise<Response<V1GetFrameResponse>> => {
  const response = await fetch(`/api/v1/frames/${id}`);

  if (!response.ok) {
    throw new Error('Failed to fetch slot data');
  }
  return response.json();
};

function WeightedStage({
  width,
  height,
  spacingX = 500,
  spacingY = 500,
}: {
  width: number;
  height: number;
  spacingX?: number;
  spacingY?: number;
}) {
  const { id } = useActiveFrame();
  const { updateFrame } = useFrames();
  const data = useFrame(id ?? '');
  const { isLoading, error } = useQuery<Response<V1GetFrameResponse>>(
    ['frameData', id],
    () => fetchFrameData(id ?? ''),
    {
      enabled: Boolean(id) && !data,
      onSuccess: (data) => {
        if (id && data.data?.frame?.data) {
          updateFrame(id, data.data?.frame?.data);
        }
      },
    },
  );

  const { minOffset, maxOffset, edges, nodes, attributes } = useWeightedGraph({
    data,
    spacingX,
    spacingY,
  });

  // TODO: fix not rendering on intial load & slow loadin on panning because it is debounced
  const performanceMode = nodes.length > 1000;

  return (
    <Stage
      width={width}
      height={height}
      options={{
        antialias: true,
        autoDensity: true,
        resolution: 2,
        backgroundAlpha: 0,
      }}
    >
      <ViewportProvider>
        <GraphViewport
          width={width}
          height={height}
          maxHeight={(maxOffset - minOffset) * spacingY + 2 * spacingY}
          maxWidth={(attributes.slotEnd - attributes.slotStart) * spacingX + 2 * spacingX}
        >
          {(viewport) => {
            useEffect(() => {
              if (!viewport) return;
              if (isLoading || error) {
                viewport.animate({
                  position: {
                    x: -width / 2,
                    y: 0,
                  },
                  scale: 1,
                  time: 0,
                });
              } else {
                viewport.animate({
                  position: {
                    x: (attributes.slotEnd - attributes.slotStart) * spacingX + spacingX,
                    y: -spacingY,
                  },
                  scale: 0.5,
                  time: 0,
                });
              }
            }, [viewport]);
            if (isLoading || error)
              return (
                <Text
                  text={isLoading ? 'Loading...' : `Error: ${error}`}
                  position={[0, 0]}
                  style={
                    new TextStyle({
                      align: 'center',
                      fontFamily: fonts.sans,
                      fontSize: 125,
                      fill: colors.stone[50],
                      wordWrap: false,
                    })
                  }
                />
              );
            return (
              <>
                {edges.map((edge) => (
                  <Edge
                    key={edge.id}
                    source={edge.source}
                    target={edge.target}
                    width={edge.canonical ? 10 : 5}
                    visible={
                      (!performanceMode ||
                        viewport?.hitArea?.contains(edge.source.x, edge.source.y) ||
                        viewport?.hitArea?.contains(edge.target.x, edge.target.y)) ??
                      true
                    }
                  />
                ))}
                {Array.from({ length: attributes.slotEnd - attributes.slotStart + 2 }).map(
                  (_, i) => (
                    <Mark
                      key={i}
                      isEnd={i === 0 || i === attributes.slotEnd - attributes.slotStart + 1}
                      showText={i !== attributes.slotEnd - attributes.slotStart + 1}
                      x={(i * spacingX) / 2 + spacingX / 4}
                      y={spacingY / 2}
                      slot={attributes.slotStart + i}
                      visible={
                        (!performanceMode || viewport?.hitArea?.contains(i * spacingX, 0)) ?? true
                      }
                    />
                  ),
                )}
                {nodes.map((node) => {
                  let type: 'canonical' | 'fork' | 'finalized' | 'justified' = node.attributes
                    .canonical
                    ? 'canonical'
                    : 'fork';
                  if (node.attributes.checkpoint) {
                    type = node.attributes.checkpoint ?? type;
                  }
                  return (
                    <WeightedNode
                      key={node.id}
                      x={node.x}
                      y={node.y}
                      hash={node.id}
                      weight={node.attributes.weight.toString()}
                      weightPercentageComparedToHeaviestNeighbor={
                        node.attributes.weightPercentageComparedToHeaviestNeighbor
                      }
                      visible={
                        (!performanceMode || viewport?.hitArea?.contains(node.x, node.y)) ?? true
                      }
                      validity={node.attributes.validity}
                      type={type}
                      onPointerTap={() => {
                        if (viewport) {
                          viewport.animate({
                            position: { x: node.x, y: node.y },
                            scale: 1,
                            time: 300,
                          });
                        }
                      }}
                    />
                  );
                })}
              </>
            );
          }}
        </GraphViewport>
      </ViewportProvider>
    </Stage>
  );
}

export default memo(WeightedStage);
