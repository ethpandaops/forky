import { ProcessedData } from '@app/types/graph';
import useActive from '@hooks/useActive';
import { useFrameQueries } from '@hooks/useQuery';
import Graph from '@parts/Graph';

export default function Stage() {
  const { ids } = useActive();
  const results = useFrameQueries(ids, ids.length > 0);

  const isLoading = results.some((result) => result.isLoading);

  let frames: ProcessedData[] = [];
  if (!isLoading) {
    frames = results.reduce<ProcessedData[]>((acc, result) => {
      if (result.data) {
        acc.push(result.data);
      }
      return acc;
    }, []);
  }

  return (
    <div
      className="w-full bg-stone-100 dark:bg-stone-900"
      style={{ height: 'calc(100vh - 148px)' }}
    >
      {!isLoading && <Graph data={frames} ids={ids} unique={ids.join('_')} />}
    </div>
  );
}
