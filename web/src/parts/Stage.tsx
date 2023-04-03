import useActiveFrame from '@hooks/useActiveFrame';
import { useFrameQuery } from '@hooks/useQuery';
import WeightedGraph from '@parts/WeightedGraph';

export default function Stage() {
  const { id } = useActiveFrame();
  const { data, isLoading, error } = useFrameQuery(id ?? '', Boolean(id));

  return (
    <div
      className="w-full bg-stone-100 dark:bg-stone-900"
      style={{ height: 'calc(100vh - 148px)' }}
    >
      <>
        {isLoading || (error && <div>{error ? `${error}` : 'Loading...'}</div>)}
        {data && <WeightedGraph data={data} />}
      </>
    </div>
  );
}
