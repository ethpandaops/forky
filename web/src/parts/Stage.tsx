import { useEffect } from 'react';

import { ProcessedData } from '@app/types/graph';
import useFocus from '@contexts/focus';
import useActive from '@hooks/useActive';
import { useFrameQueries } from '@hooks/useQuery';
import Graph from '@parts/Graph';

export default function Stage() {
  const { ids } = useActive();
  const { byo, stop, byoData } = useFocus();
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

  return (
    <div
      className="w-full bg-stone-100 dark:bg-stone-900"
      style={{ height: 'calc(100vh - 148px)' }}
    >
      {!isLoading && <Graph data={data.frames} ids={ids} unique={data.loadedIds.join('_')} />}
    </div>
  );
}
