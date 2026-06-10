import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import classNames from 'clsx';
import ReactTimeAgo from 'react-time-ago';
import Link from '@components/Link';

import { ProcessedData, WeightedNodeAttributes } from '@app/types/graph';
import Download from '@components/Download';
import Loading from '@components/Loading';
import { SummaryLink } from '@components/Summary';
import useSelection from '@contexts/selection';
import { useFrameQueries } from '@hooks/useQuery';
import { aggregateProcessedData } from '@utils/graph';
import { truncateHash } from '@utils/strings';

const HEADER_CELL =
  'px-2.5 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-faint';
const BODY_CELL = 'whitespace-nowrap px-2.5 py-2 text-sm text-foreground';

export default function AggregatedFramesSummary({ ids }: { ids: string[] }) {
  const { clearAll } = useSelection();
  const results = useFrameQueries(ids);
  if (results.some(r => r.isLoading)) {
    return <Loading message="Loading..." />;
  }

  const graph = aggregateProcessedData(
    results.reduce<ProcessedData[]>((acc, { data }) => {
      if (data) acc.push(data);
      return acc;
    }, []),
  );

  return (
    <div className="mx-4 overflow-hidden rounded-xl border border-border bg-surface shadow-xs sm:mx-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border-strong">
          <thead>
            <tr className="divide-x divide-border">
              <th rowSpan={2} scope="col" className={classNames(HEADER_CELL, 'align-bottom pl-4')}>
                Source
              </th>
              <th rowSpan={2} scope="col" className={classNames(HEADER_CELL, 'align-bottom')}>
                Taken At
              </th>
              <th
                colSpan={2}
                scope="col"
                className="border-b border-b-border px-2.5 py-2 text-center font-mono text-[10px] font-semibold uppercase tracking-wider text-faint"
              >
                Head
              </th>
              <th
                colSpan={2}
                scope="col"
                className="border-b border-b-border px-2.5 py-2 text-center font-mono text-[10px] font-semibold uppercase tracking-wider text-faint"
              >
                Finalized
              </th>
              <th
                colSpan={2}
                scope="col"
                className="border-b border-b-border px-2.5 py-2 text-center font-mono text-[10px] font-semibold uppercase tracking-wider text-faint"
              >
                Justified
              </th>
              <th rowSpan={2} scope="col" className={classNames(HEADER_CELL, 'align-bottom')}>
                Snapshot ID
              </th>
              <th rowSpan={2} scope="col" className="px-2.5 py-2 align-bottom">
                <span className="sr-only">View</span>
              </th>
            </tr>
            <tr className="divide-x divide-border">
              <th scope="col" className={HEADER_CELL}>
                Slot
              </th>
              <th scope="col" className={HEADER_CELL}>
                Root
              </th>
              <th scope="col" className={HEADER_CELL}>
                Epoch
              </th>
              <th scope="col" className={HEADER_CELL}>
                Root
              </th>
              <th scope="col" className={HEADER_CELL}>
                Epoch
              </th>
              <th scope="col" className={HEADER_CELL}>
                Root
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {results.map(({ data }, i) => {
              if (!data)
                return (
                  <tr key={i} className="divide-x divide-border">
                    <td colSpan={10} className={BODY_CELL}>
                      Data error
                    </td>
                  </tr>
                );
              let head: WeightedNodeAttributes | undefined;
              try {
                head = data.graph.getNodeAttributes(data.graph.getAttribute('head'));
              } catch (err) {
                // ignore
              }

              const isCanonicalHead =
                graph.getAttribute('head') === data.graph.getAttribute('head');
              return (
                <tr key={i} className="divide-x divide-border">
                  <td className={classNames(BODY_CELL, 'pl-4')}>
                    <SummaryLink href={`/node/${data.frame.metadata.node}`} onClick={clearAll}>
                      {data.frame.metadata.node}
                    </SummaryLink>
                  </td>
                  <td
                    className={BODY_CELL}
                    title={new Date(data.frame.metadata.fetched_at).toISOString()}
                  >
                    <ReactTimeAgo date={new Date(data.frame.metadata.fetched_at)} />
                  </td>
                  <td
                    className={classNames(
                      BODY_CELL,
                      'font-semibold',
                      isCanonicalHead ? 'text-success' : 'text-danger',
                    )}
                  >
                    {head?.slot}
                  </td>
                  <td
                    className={classNames(
                      BODY_CELL,
                      'font-mono text-xs font-semibold',
                      isCanonicalHead ? 'text-success' : 'text-danger',
                    )}
                    title={head?.blockRoot}
                  >
                    {head?.blockRoot && truncateHash(head.blockRoot)}
                  </td>
                  <td className={BODY_CELL}>{data.frame.data.finalized_checkpoint?.epoch}</td>
                  <td
                    className={classNames(BODY_CELL, 'font-mono text-xs')}
                    title={data.frame.data.finalized_checkpoint?.root}
                  >
                    {data.frame.data.finalized_checkpoint?.root &&
                      truncateHash(data.frame.data.finalized_checkpoint.root)}
                  </td>
                  <td className={BODY_CELL}>{data.frame.data.justified_checkpoint?.epoch}</td>
                  <td
                    className={classNames(BODY_CELL, 'font-mono text-xs')}
                    title={data.frame.data.justified_checkpoint?.root}
                  >
                    {data.frame.data.justified_checkpoint?.root &&
                      truncateHash(data.frame.data.justified_checkpoint.root)}
                  </td>
                  <td className={classNames(BODY_CELL, 'font-mono text-xs')}>
                    <SummaryLink href={`/snapshot/${data.frame.metadata.id}`} onClick={clearAll}>
                      {truncateHash(data.frame.metadata.id)}
                    </SummaryLink>
                  </td>
                  <td className="relative flex items-center gap-1.5 whitespace-nowrap px-2.5 py-2 text-right text-sm font-medium text-foreground">
                    <Download
                      data={JSON.stringify(data.frame)}
                      filename={`snapshot-${data.frame.metadata.id}.json`}
                      className="w-8"
                    />
                    <Link href={`/node/${data.frame.metadata.node}`} onClick={clearAll}>
                      <MagnifyingGlassIcon className="h-8 w-8 cursor-pointer rounded-md p-1.5 transition hover:bg-overlay/5" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
