import { ProcessedData } from '@app/types/graph';
import useActive from '@hooks/useActive';
import { useFrameQueries } from '@hooks/useQuery';
import Graph from '@parts/Graph';

export default function Stage() {
  const { ids } = useActive();
  const results = useFrameQueries(ids, ids.length > 0);

  const isLoading = results.every((result) => result.isLoading);

  let data: { frames: ProcessedData[]; loadedIds: string[] } = {
    frames: [],
    loadedIds: [],
  };
  if (!isLoading) {
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
