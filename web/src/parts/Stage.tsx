import { useEffect } from 'react';

import classNames from 'clsx';

import { ProcessedData } from '@app/types/graph';
import useFocus from '@contexts/focus';
import useActive from '@hooks/useActive';
import { useFrameQueries } from '@hooks/useQuery';
import Graph from '@parts/Graph';

export default function Stage() {
  const { ids } = useActive();
  const { byo, stop, byoData, frameId } = useFocus();
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
      {!isLoading && <Graph data={data.frames} ids={ids} unique={data.loadedIds.join('_')} />}
    </div>
  );
}
