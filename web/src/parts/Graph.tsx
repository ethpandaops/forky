import { useRef, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';

import { ViewfinderCircleIcon as ViewfinderCircleIconOutline } from '@heroicons/react/24/outline';
import {
  ViewfinderCircleIcon as ViewfinderCircleIconSolid,
  ArrowLeftCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/solid';
import classNames from 'classnames';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { useLocation, Link } from 'wouter';

import SlotBoundary from '@app/components/SlotBoundary';
import { AggregatedNodeAttributes, ProcessedData, WeightedNodeAttributes } from '@app/types/graph';
import { truncateHash } from '@app/utils/strings';
import AggregatedNode from '@components/AggregatedNode';
import Edge from '@components/Edge';
import Share from '@components/Share';
import WeightedNode from '@components/WeightedNode';
import useEthereum from '@contexts/ethereum';
import useSelection from '@contexts/selection';
import useGraph from '@hooks/useGraph';
import useWindowSize from '@hooks/useWindowSize';

const RADIUS = 150;
const SPACING_X = 3 * RADIUS;
const SPACING_Y = 4 * RADIUS;

function calculateScaleMultiplier(windowWidth: number, windowHeight: number) {
  if (windowWidth < 1024 || windowHeight < 1024) return 0.5;
  if (windowWidth < 1440 || windowHeight < 2048) return 0.75;
  return 1;
}

function Graph({ data, ids, unique }: { data: ProcessedData[]; ids: string[]; unique: string }) {
  const [location, navigate] = useLocation();
  const { setFrameId, setAggregatedFrameIds, setFrameBlock, setAggregatedFramesBlock } =
    useSelection();
  const { slotsPerEpoch } = useEthereum();
  const ref = useRef<ReactZoomPanPinchRef>(null);
  const { nodes, edges, type, id, slotEnd, slotStart, head } = useGraph({
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
    if (focused) ref.current?.zoomToElement('head', scaleMultiplier);
  }, [nodes]);

  const slotWidth = slotEnd - slotStart;

  const width = slotWidth * SPACING_X;

  const slotBoundaries = useMemo(() => {
    if (slotWidth <= 0) return null;
    return Array.from({ length: slotWidth + 1 }, (_, index) => {
      const slot = index + slotStart;
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
  }, [slotEnd, slotStart]);

  const handleFocus = useCallback(() => {
    ref.current?.resetTransform();
    setScale(scaleMultiplier);
    ref.current?.zoomToElement('head', scaleMultiplier);
    setFocused(true);
  }, [focused, ref.current, setFocused]);

  const handleNavigateAggregatedView = useCallback(() => {
    navigate(`/`);
  }, []);

  const formattedSummary = useMemo(() => {
    return data
      .sort(({ frame: a }, { frame: b }) => a.metadata.node.localeCompare(b.metadata.node))
      .map(({ frame, graph }) => {
        let weightedHead: WeightedNodeAttributes | undefined;
        let isAggregatedHead = false;
        try {
          const weightedGraphHeadId = graph.getAttribute('head');
          isAggregatedHead = weightedGraphHeadId === head;
          weightedHead = graph.getNodeAttributes(weightedGraphHeadId);
        } catch (err) {
          // ignore
        }

        return (
          <tr key={frame.metadata.id}>
            <td className="whitespace-nowrap py-1 text-xs 2xl:text-sm">
              <Link href={`/node/${frame.metadata.node}`} className="font-bold">
                {frame.metadata.node}
              </Link>
            </td>
            <td className="whitespace-nowrap py-1 pl-4 text-xs hidden 2xl:block 2xl:text-sm">
              <Link
                href={`/node/${frame.metadata.node}`}
                className={classNames(
                  'font-semibold',
                  isAggregatedHead
                    ? 'text-green-800 dark:text-green-300'
                    : 'text-amber-500 dark:text-amber-300',
                )}
              >
                {weightedHead?.slot}
              </Link>
            </td>
            <td className="whitespace-nowrap py-1 pl-4 text-xs 2xl:text-sm">
              <Link
                href={`/node/${frame.metadata.node}`}
                className={classNames(
                  'font-semibold',
                  isAggregatedHead
                    ? 'text-green-800 dark:text-green-300'
                    : 'text-amber-500 dark:text-amber-300',
                )}
              >
                {truncateHash(weightedHead?.blockRoot)}
              </Link>
            </td>
          </tr>
        );
      });
  }, [unique]);

  const { formattedNodes, formattedEdges } = useMemo(() => {
    let newNodes: ReactNode[] = [];

    const newEdges = edges.map((edge) => (
      <Edge
        key={`${edge.source.id}-${edge.target.id}`}
        x1={edge.source.x + RADIUS}
        y1={edge.source.y + RADIUS}
        x2={edge.target.x + RADIUS}
        y2={edge.target.y + RADIUS}
        className="dark:bg-stone-50 bg-stone-700"
        thickness={12}
      />
    ));

    if (type === 'aggregated') {
      newNodes = nodes.map((node) => {
        const { canonical, slot, blockRoot, canonicalForNodes, seenByNodes } =
          node.attributes as AggregatedNodeAttributes;
        // TODO: handle invalid nodes
        const type: 'canonical' | 'fork' | 'finalized' | 'justified' | 'detached' = canonical
          ? 'canonical'
          : 'fork';
        return (
          <AggregatedNode
            key={node.id}
            id={node.id === head ? 'head' : undefined}
            x={node.x}
            y={node.y}
            validity="valid"
            seen={seenByNodes.length}
            canonical={canonicalForNodes.length}
            total={data.length}
            type={type}
            hash={blockRoot}
            radius={RADIUS}
            onClick={() => {
              setAggregatedFramesBlock({
                frameIds: ids,
                blockRoot,
              });
            }}
          />
        );
      });
    } else if (type === 'weighted') {
      newNodes = nodes.map((node) => {
        const {
          canonical,
          checkpoint,
          orphaned,
          validity,
          weight,
          weightPercentageComparedToHeaviestNeighbor,
          blockRoot,
        } = node.attributes as WeightedNodeAttributes;

        let type: 'canonical' | 'fork' | 'finalized' | 'justified' | 'detached' | 'invalid' =
          canonical ? 'canonical' : 'fork';
        if (checkpoint) type = checkpoint;
        if (orphaned) type = 'detached';
        return (
          <WeightedNode
            key={node.id}
            id={node.id === head ? 'head' : undefined}
            x={node.x}
            y={node.y}
            weight={`${weight}`}
            weightPercentageComparedToHeaviestNeighbor={weightPercentageComparedToHeaviestNeighbor}
            type={type}
            validity={validity}
            hash={blockRoot}
            radius={RADIUS}
            onClick={() => {
              setFrameBlock({
                frameId: data[0].frame.metadata.id,
                blockRoot,
              });
            }}
          />
        );
      });
    }

    return { formattedNodes: newNodes, formattedEdges: newEdges };
  }, [id, nodes, edges, slotEnd, type]);

  return (
    <>
      {location.startsWith('/node/') && (
        <button
          className="absolute text-stone-900 dark:text-stone-100 mt-24 ml-5 lg:ml-8 z-20 flex items-center p-2 rounded transition hover:bg-stone-900/5 dark:hover:bg-white/5"
          onClick={handleNavigateAggregatedView}
        >
          <ArrowLeftCircleIcon className="h-6 w-6 mr-1" />
          Aggregated view
        </button>
      )}
      {type === 'weighted' && (
        <button
          className={classNames(
            'absolute text-stone-900 dark:text-stone-100 ml-5 lg:ml-8 z-20 flex items-center p-2 rounded transition hover:bg-stone-900/5 dark:hover:bg-white/5',
            location.startsWith('/node/') ? 'mt-36' : ' mt-24',
          )}
          onClick={() => {
            setFrameId(data[0].frame.metadata.id);
          }}
        >
          <InformationCircleIcon className="h-6 w-6 mr-1" />
          Snapshot
        </button>
      )}
      {type === 'aggregated' && formattedSummary.length && (
        <div className="absolute mt-24 ml-5 lg:ml-8 z-20 text-xs 2xl:text-sm">
          <button
            className="flex lg:hidden text-stone-900 dark:text-stone-100 items-center p-1 2xl:p-2 rounded transition hover:bg-stone-900/5 dark:hover:bg-white/5"
            onClick={() => {
              setAggregatedFrameIds(ids);
            }}
          >
            <InformationCircleIcon className="h-6 w-6 mr-1" />
            Sources
          </button>
          <div className="hidden lg:flex flex-col px-2 2xl:px-4 pt-1 pb-1 2xl:pb-4 rounded bg-stone-200/90 dark:bg-stone-800/90 text-stone-900 dark:text-stone-100">
            <div className="flex items-center justify-between w-full">
              <span className="font-bold">Sources</span>
              <button
                className="flex text-stone-900 dark:text-stone-100 text-xs 2xl:text-sm items-center p-2 rounded transition hover:bg-stone-900/5 dark:hover:bg-white/5"
                onClick={() => {
                  setAggregatedFrameIds(ids);
                }}
              >
                <InformationCircleIcon className="w-4 h-4 2xl:w-5 2xl:h-5 mr-1" />
                More
              </button>
            </div>
            <div className="mt-0 mb-1 2xl:mt-1 2xl:mb-3 border-t border-t-stone-900 dark:border-t-stone-100" />
            <table className="min-w-full">
              <tbody className="divide-y divide-gray-800">{formattedSummary}</tbody>
            </table>
          </div>
        </div>
      )}
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
              <Share />
              <span
                onClick={handleFocus}
                title="Focus to the head of the canonical chain"
                className="fixed z-10 right-6 lg:right-8 top-36 text-stone-700 dark:text-stone-300 cursor-pointer w-10 h-10 rounded-md transition hover:bg-stone-900/5 dark:hover:bg-white/5"
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
                {formattedEdges}
                {formattedNodes}
              </TransformComponent>
            </div>
          );
        }}
      </TransformWrapper>
    </>
  );
}

export default Graph;
