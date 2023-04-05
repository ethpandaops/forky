import { useRef, useState, useEffect, useMemo, useCallback } from 'react';

import { ViewfinderCircleIcon as ViewfinderCircleIconOutline } from '@heroicons/react/24/outline';
import { ViewfinderCircleIcon as ViewfinderCircleIconSolid } from '@heroicons/react/24/solid';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';

import { Data } from '@app/api/frames';
import SlotBoundary from '@app/components/SlotBoundary';
import Edge from '@components/Edge';
import WeightedNode from '@components/WeightedNode';
import useEthereum from '@contexts/ethereum';
import useSelection from '@contexts/selection';
import useWeightedGraph from '@hooks/useWeightedGraph';
import useWindowSize from '@hooks/useWindowSize';

const RADIUS = 150;
const SPACING_X = 3 * RADIUS;
const SPACING_Y = 4 * RADIUS;

function calculateScaleMultiplier(windowWidth: number, windowHeight: number) {
  if (windowWidth < 768 || windowHeight < 768) return 0.5;
  return 1;
}

function WeightedGraph({ data }: { data: Data }) {
  const { setBlockRoot } = useSelection();
  const { slotsPerEpoch } = useEthereum();
  const ref = useRef<ReactZoomPanPinchRef>(null);
  const { nodes, edges, graph } = useWeightedGraph({
    data,
    spacingX: SPACING_X,
    spacingY: SPACING_Y,
  });
  const [windowWidth, windowHeight] = useWindowSize();
  const [scaleMultiplier, setScaleMultiplier] = useState(
    calculateScaleMultiplier(windowWidth, windowHeight),
  );
  const [scale, setScale] = useState(scaleMultiplier);
  const [focused, setFocused] = useState(true);

  useEffect(() => {
    setScaleMultiplier(calculateScaleMultiplier(windowWidth, windowHeight));
  }, [windowHeight, windowWidth]);

  useEffect(() => {
    if (focused) ref.current?.zoomToElement('lastnode', scaleMultiplier);
  }, [nodes]);

  const slotWidth = (graph?.getAttribute('slotEnd') ?? 0) - (graph?.getAttribute('slotStart') ?? 0);

  const width = slotWidth * SPACING_X;

  const slotBoundaries = useMemo(() => {
    return Array.from({ length: slotWidth + 1 }, (_, index) => {
      const slot = index + (graph?.getAttribute('slotStart') ?? 0);
      const isEpoch = slot % slotsPerEpoch === 0;
      return (
        <SlotBoundary
          key={slot}
          slot={slot}
          epoch={isEpoch ? slot / slotsPerEpoch : undefined}
          width={8}
          height={1800}
          x={SPACING_X - RADIUS / 2 + index * SPACING_X}
          y={-SPACING_Y + RADIUS - 1800 / 2}
          textOffset={SPACING_Y / 2 - RADIUS / 1.5}
          className="bg-gradient-to-t from-stone-100 dark:from-stone-900 from-10% dark:from-10% via-stone-500 dark:via-stone-500 via-50% dark:via-50% to-stone-100 dark:to-stone-900 to-90% dark:to-90%"
        />
      );
    });
  }, [graph?.getAttribute('slotStart'), graph?.getAttribute('slotEnd')]);

  const handleFocus = useCallback(() => {
    ref.current?.resetTransform();
    setScale(scaleMultiplier);
    ref.current?.zoomToElement('lastnode', scaleMultiplier);
    setFocused(true);
  }, [focused, ref.current, setFocused]);

  return (
    <TransformWrapper
      ref={ref}
      limitToBounds={false}
      initialScale={scale}
      initialPositionX={
        -width * scaleMultiplier +
        window.innerWidth / 2 -
        SPACING_X * scaleMultiplier -
        RADIUS * scaleMultiplier
      }
      initialPositionY={
        window.innerHeight / 2 +
        SPACING_Y * scaleMultiplier -
        RADIUS * 1.5 * scaleMultiplier +
        1 * scaleMultiplier
      }
      minScale={0.1}
      onZoom={(ref) => {
        if (focused) setFocused(false);
        setScale(ref.state.scale);
      }}
      maxScale={10}
      onPanning={() => {
        if (focused) setFocused(false);
      }}
    >
      {() => {
        return (
          <div className="w-full h-full">
            <span
              onClick={handleFocus}
              className="fixed z-10 right-8 top-28 text-stone-700 dark:text-stone-300 cursor-pointer w-10 h-10 rounded-md transition hover:bg-stone-900/5 dark:hover:bg-white/5"
            >
              <span className="sr-only">Focus to the head of the canonical chain</span>
              {focused && (
                <>
                  <ViewfinderCircleIconSolid onClick={handleFocus} className="fixed h-10 w-10" />
                  <span className="fixed mt-4 ml-4 h-2 w-2">
                    <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-green-400 dark:bg-green-700"></span>
                  </span>
                </>
              )}
              {!focused && (
                <ViewfinderCircleIconOutline onClick={handleFocus} className="fixed h-10 w-10" />
              )}
            </span>
            <TransformComponent
              wrapperStyle={{
                minWidth: `100%`,
                minHeight: `100%`,
              }}
            >
              {slotBoundaries}
              {edges?.map((edge) => (
                <Edge
                  key={`${edge.source.id}-${edge.target.id}`}
                  x1={edge.source.x + RADIUS}
                  y1={edge.source.y + RADIUS}
                  x2={edge.target.x + RADIUS}
                  y2={edge.target.y + RADIUS}
                  className="dark:bg-white bg-stone-500"
                  thickness={12}
                />
              ))}
              {nodes?.map((node) => {
                let type: 'canonical' | 'fork' | 'finalized' | 'justified' | 'detached' = node
                  .attributes.canonical
                  ? 'canonical'
                  : 'fork';
                if (node.attributes.checkpoint) {
                  type = node.attributes.checkpoint ?? type;
                }
                if (node.attributes.orphaned) {
                  type = 'detached';
                }
                return (
                  <WeightedNode
                    key={node.id}
                    id={
                      node.attributes.slot === graph?.getAttribute('slotEnd')
                        ? 'lastnode'
                        : undefined
                    }
                    x={node.x}
                    y={node.y}
                    weight={node.attributes.weight.toString()}
                    weightPercentageComparedToHeaviestNeighbor={
                      node.attributes.weightPercentageComparedToHeaviestNeighbor
                    }
                    type={type}
                    hash={node.id}
                    radius={RADIUS}
                    onClick={setBlockRoot}
                  />
                );
              })}
            </TransformComponent>
          </div>
        );
      }}
    </TransformWrapper>
  );
}

export default WeightedGraph;
