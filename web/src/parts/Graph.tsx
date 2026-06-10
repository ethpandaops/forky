import { useRef, useState, useEffect, useMemo, useCallback, ReactNode, memo } from 'react';

import { ViewfinderCircleIcon as ViewfinderCircleIconOutline } from '@heroicons/react/24/outline';
import {
  ViewfinderCircleIcon as ViewfinderCircleIconSolid,
  ArrowLeftCircleIcon,
  InformationCircleIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/solid';
import classNames from 'clsx';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import Link from '@components/Link';
import { useAppNavigate, usePathname } from '@hooks/useAppNavigation';

import SlotBoundary from '@app/components/SlotBoundary';
import { AggregatedNodeAttributes, ProcessedData, WeightedNodeAttributes } from '@app/types/graph';
import { getFrameSlotsBehind } from '@app/utils/graph';
import { truncateHash } from '@app/utils/strings';
import AggregatedNode from '@components/AggregatedNode';
import Edge from '@components/Edge';
import Share from '@components/Share';
import TruncationMarker from '@components/TruncationMarker';
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

function Graph({
  data,
  behind = [],
  ids,
  unique,
}: {
  data: ProcessedData[];
  behind?: ProcessedData[];
  ids: string[];
  unique: string;
}) {
  const location = usePathname();
  const navigate = useAppNavigate();
  const { setFrameId, setAggregatedFrameIds, setFrameBlock, setAggregatedFramesBlock } =
    useSelection();
  const { slotsPerEpoch } = useEthereum();
  const ref = useRef<ReactZoomPanPinchRef>(null);
  const { nodes, edges, type, slotEnd, slotStart, head, truncation } = useGraph({
    data,
    spacingX: SPACING_X,
    spacingY: SPACING_Y,
  });

  const isBYO = location.startsWith('/byo');

  const [windowWidth, windowHeight] = useWindowSize();
  const scaleMultiplier = calculateScaleMultiplier(windowWidth, windowHeight);
  const [scale, setScale] = useState(scaleMultiplier);
  const [focused, setFocused] = useState(true);
  const [isSummaryCollapsed, setIsSummaryCollapsed] = useState(false);

  useEffect(() => {
    if (focused) ref.current?.zoomToElement('head', scaleMultiplier);
  }, [nodes, focused, scaleMultiplier]);

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
          width={4}
          height={1800}
          x={SPACING_X - RADIUS / 2 + index * SPACING_X}
          y={-SPACING_Y + RADIUS - 1800 / 2}
          textOffset={SPACING_Y / 2 - RADIUS / 1.5}
          className="column-fade"
        />
      );
    });
  }, [slotStart, slotsPerEpoch, slotWidth]);

  const handleFocus = useCallback(() => {
    ref.current?.resetTransform();
    setScale(scaleMultiplier);
    ref.current?.zoomToElement('head', scaleMultiplier);
    setFocused(true);
  }, [setFocused, scaleMultiplier]);

  const handleNavigateAggregatedView = useCallback(() => {
    navigate(`/`);
  }, [navigate]);

  const formattedSummary = useMemo(() => {
    return [
      ...data.map(frame => ({ frame, slotsBehind: 0 })),
      ...behind.map(frame => ({ frame, slotsBehind: getFrameSlotsBehind(frame) })),
    ]
      .sort((a, b) => a.frame.frame.metadata.node.localeCompare(b.frame.frame.metadata.node))
      .map(({ frame: { frame, graph }, slotsBehind }) => {
        const isBehind = slotsBehind > 0;
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
            <td className="whitespace-nowrap py-1 text-xs">
              <Link
                href={`/node/${frame.metadata.node}`}
                className={classNames(
                  'font-medium transition-colors duration-150',
                  isBehind
                    ? 'text-danger line-through hover:text-danger/80'
                    : 'text-foreground hover:text-link',
                )}
              >
                {frame.metadata.node}
              </Link>
            </td>
            <td className="whitespace-nowrap py-1 pl-3 text-xs">
              {isBehind ? (
                <span
                  className="font-mono font-semibold text-danger tabular-nums"
                  title={`${slotsBehind} slots behind`}
                >
                  {slotsBehind} slots behind
                </span>
              ) : (
                <Link
                  href={`/node/${frame.metadata.node}`}
                  className={classNames(
                    'font-mono font-medium',
                    isAggregatedHead ? 'text-success' : 'text-warning',
                  )}
                >
                  {truncateHash(weightedHead?.blockRoot)}
                </Link>
              )}
            </td>
          </tr>
        );
      });
  }, [data, behind, head]);

  const { formattedNodes, formattedEdges } = useMemo(() => {
    let newNodes: ReactNode[] = [];

    const newEdges = edges.map(edge => (
      <Edge
        key={`${edge.source.id}-${edge.target.id}-${edge.id}`}
        x1={edge.source.x + RADIUS}
        y1={edge.source.y + RADIUS}
        x2={edge.target.x + RADIUS}
        y2={edge.target.y + RADIUS}
        className="bg-edge"
        thickness={8}
      />
    ));

    if (type === 'aggregated') {
      newNodes = nodes.map(node => {
        const {
          canonical,
          blockRoot,
          canonicalForNodes,
          seenByNodes,
          checkpoints,
          orphaned,
          validities,
        } = node.attributes as AggregatedNodeAttributes;

        const type: 'canonical' | 'fork' = canonical ? 'canonical' : 'fork';

        const [finalizedCheckpoints, justifiedCheckpoints] = checkpoints.reduce<[number, number]>(
          ([finalized, justified], checkpoint) => {
            if (checkpoint.checkpoint === 'finalized') {
              return [finalized + 1, justified];
            } else if (checkpoint.checkpoint === 'justified') {
              return [finalized, justified + 1];
            }
            return [finalized, justified];
          },
          [0, 0],
        );

        return (
          <AggregatedNode
            key={node.id}
            id={node.id === head ? 'head' : undefined}
            x={node.x}
            y={node.y}
            seen={seenByNodes.length}
            canonical={canonicalForNodes.length}
            finalizedCheckpoints={finalizedCheckpoints}
            justifiedCheckpoints={justifiedCheckpoints}
            orphans={orphaned.length}
            valid={validities.filter(v => ['valid', 'optimistic'].includes(v.validity)).length}
            optimistic={validities.filter(v => v.validity === 'optimistic').length}
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
      newNodes = nodes.map(node => {
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
  }, [unique]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {location.startsWith('/node/') && (
        <button
          className="glass-chrome absolute top-16 left-4 z-20 flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted shadow-md transition-colors duration-150 hover:text-foreground lg:left-6 2xl:text-sm"
          onClick={handleNavigateAggregatedView}
        >
          <ArrowLeftCircleIcon className="size-5" />
          Aggregated view
        </button>
      )}
      {!isBYO && type === 'weighted' && (
        <button
          className={classNames(
            'glass-chrome absolute left-4 z-20 flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted shadow-md transition-colors duration-150 hover:text-foreground lg:left-6 2xl:text-sm',
            location.startsWith('/node/') ? 'top-[6.75rem]' : 'top-16',
          )}
          onClick={() => {
            setFrameId(data[0].frame.metadata.id);
          }}
        >
          <InformationCircleIcon className="size-5" />
          Snapshot
        </button>
      )}
      {!isBYO && type === 'aggregated' && formattedSummary.length && (
        <div className="absolute top-16 left-4 z-20 text-xs lg:left-6">
          <button
            className="glass-chrome flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted shadow-md transition-colors duration-150 hover:text-foreground lg:hidden"
            onClick={() => {
              setAggregatedFrameIds(ids);
            }}
          >
            <InformationCircleIcon className="size-5" />
            Sources
          </button>
          {isSummaryCollapsed ? (
            <button
              aria-label="Show sources"
              className="glass-chrome hidden items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted shadow-md transition-colors duration-150 hover:text-foreground lg:flex"
              onClick={() => setIsSummaryCollapsed(false)}
            >
              <ChevronDownIcon className="size-4" />
              <span className="font-mono text-[10px]/4 font-semibold uppercase tracking-widest">
                Sources
              </span>
            </button>
          ) : (
            <div className="glass-chrome hidden flex-col rounded-xl border border-border px-3 pt-2 pb-2 text-foreground shadow-lg lg:flex">
              <div className="flex w-full items-center justify-between gap-6">
                <span className="font-mono text-[10px]/4 font-semibold uppercase tracking-widest text-faint">
                  Sources
                </span>
                <div className="flex">
                  <button
                    aria-label="Collapse sources"
                    className="mr-1 flex items-center rounded p-1 text-xs text-muted transition-colors duration-150 hover:bg-overlay/5 hover:text-foreground"
                    onClick={() => setIsSummaryCollapsed(true)}
                  >
                    <ChevronUpIcon className="size-4" />
                  </button>
                  <button
                    className="flex items-center gap-1 rounded p-1 text-xs text-muted transition-colors duration-150 hover:bg-overlay/5 hover:text-foreground"
                    onClick={() => {
                      setAggregatedFrameIds(ids);
                    }}
                  >
                    <InformationCircleIcon className="size-4" />
                    More
                  </button>
                </div>
              </div>
              <div className="mt-1.5 mb-1 border-t border-border" />
              <table className="min-w-full">
                <tbody className="divide-y divide-border">{formattedSummary}</tbody>
              </table>
            </div>
          )}
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
        onZoom={ref => {
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
              {!isBYO && <Share />}
              <span
                onClick={handleFocus}
                title="Focus to the head of the canonical chain"
                className={classNames(
                  isBYO ? 'top-16' : 'top-[6.75rem]',
                  'glass-chrome fixed right-4 z-10 flex size-9 cursor-pointer items-center justify-center rounded-lg border border-border text-muted shadow-md transition-colors duration-150 hover:text-foreground lg:right-6',
                )}
              >
                <span className="sr-only">Focus to the head of the canonical chain</span>
                {focused && (
                  <>
                    <ViewfinderCircleIconSolid className="size-6" />
                    <span className="absolute size-1.5">
                      <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-live"></span>
                    </span>
                  </>
                )}
                {!focused && <ViewfinderCircleIconOutline className="size-6" />}
              </span>
              <TransformComponent
                wrapperStyle={{
                  minWidth: `100%`,
                  minHeight: `100%`,
                }}
              >
                {slotBoundaries}
                {truncation?.markers.map(marker => (
                  <SlotBoundary
                    key={`truncation-line-${marker.x}`}
                    width={4}
                    height={1800}
                    x={marker.x - RADIUS / 2}
                    y={-SPACING_Y + RADIUS - 1800 / 2}
                    textOffset={SPACING_Y / 2 - RADIUS / 1.5}
                    className="column-fade"
                  />
                ))}
                {truncation?.checkpoints.map(checkpoint => {
                  const isEpoch = checkpoint.slot % slotsPerEpoch === 0;
                  return (
                    <SlotBoundary
                      key={`checkpoint-${checkpoint.slot}`}
                      slot={checkpoint.slot}
                      epoch={isEpoch ? checkpoint.slot / slotsPerEpoch : undefined}
                      width={4}
                      height={1800}
                      x={checkpoint.x - RADIUS / 2}
                      y={-SPACING_Y + RADIUS - 1800 / 2}
                      textOffset={SPACING_Y / 2 - RADIUS / 1.5}
                      className="column-fade"
                    />
                  );
                })}
                {formattedEdges}
                {truncation && (
                  <>
                    {truncation.rail && (
                      <Edge
                        x1={truncation.rail.x1 + RADIUS}
                        y1={truncation.rail.y1 + RADIUS}
                        x2={truncation.rail.x2 + RADIUS}
                        y2={truncation.rail.y2 + RADIUS}
                        className="bg-edge"
                        thickness={8}
                      />
                    )}
                    {truncation.markers.map(marker => (
                      <TruncationMarker
                        key={`${marker.x}-${marker.y}`}
                        x={marker.x}
                        y={marker.y}
                        radius={RADIUS}
                        slots={marker.slots}
                      />
                    ))}
                  </>
                )}
                {formattedNodes}
              </TransformComponent>
            </div>
          );
        }}
      </TransformWrapper>
    </>
  );
}

export default memo(Graph, (prevProps, nextProps) => prevProps.unique === nextProps.unique);
