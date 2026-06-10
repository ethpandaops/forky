import { useEffect } from 'react';

import classNames from 'clsx';

import { ProcessedData } from '@app/types/graph';
import { partitionFramesBySlotLag } from '@app/utils/graph';
import useFocus from '@contexts/focus';
import useActive from '@hooks/useActive';
import { useFrameQueries } from '@hooks/useQuery';
import Graph from '@parts/Graph';

export default function Stage() {
  const { ids } = useActive();
  const { byo, stop, byoData, frameId, node: focusedNode } = useFocus();
  const results = useFrameQueries(ids, !byo && ids.length > 0);

  useEffect(() => {
    if (byo) stop();
  }, [byo, stop]);
  useEffect(() => {
    if (byoData) stop();
  }, [byoData, stop]);

  const isLoading = !byo && results.every(result => result.isLoading);
  let data: { frames: ProcessedData[]; loadedIds: string[] } = {
    frames: byoData ? [byoData] : [],
    loadedIds: byoData ? [byoData.frame.metadata.id] : [],
  };

  if (!byo && !isLoading) {
    data = results.reduce<{ frames: ProcessedData[]; loadedIds: string[] }>(
      (acc, result) => {
        if (result.data) {
          acc.frames.push(result.data);
          acc.loadedIds.push(result.data.frame.metadata.id);
        }
        return acc;
      },
      { frames: [], loadedIds: [] },
    );
  }

  // Exclude nodes whose head is too far behind their metadata slot (e.g. a
  // stuck/syncing node) from the aggregated view, but keep them around so the
  // sources panel can still list them crossed out. Single node views
  // (/node/:name) bypass this entirely — they only render that one node, so
  // there is nothing to compare it against.
  const { live, behind } = focusedNode
    ? { live: data.frames, behind: [] as ProcessedData[] }
    : partitionFramesBySlotLag(data.frames);
  const liveIds = live.map(frame => frame.frame.metadata.id);

  // The timeline footer grows to 138px when the epoch dial appears at xl;
  // the BYO/snapshot footers stay at 97px on all breakpoints.
  const hasTimelineFooter = !byo && !frameId;

  return (
    <div
      className={classNames(
        'stage-grid h-[calc(100dvh-97px)] w-full bg-background',
        hasTimelineFooter && 'xl:h-[calc(100dvh-138px)]',
      )}
    >
      {!isLoading && (
        <Graph data={live} behind={behind} ids={liveIds} unique={data.loadedIds.join('_')} />
      )}
    </div>
  );
}
