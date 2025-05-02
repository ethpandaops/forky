import { MagnifyingGlassIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid';
import classNames from 'clsx';
import ReactTimeAgo from 'react-time-ago';
import { Link } from 'wouter';

import { ProcessedData, WeightedNodeAttributes } from '@app/types/graph';
import Download from '@components/Download';
import Loading from '@components/Loading';
import useSelection from '@contexts/selection';
import { useFrameQueries } from '@hooks/useQuery';
import { aggregateProcessedData } from '@utils/graph';

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
    <div className="bg-stone-50 dark:bg-stone-800 shadow dark:shadow-inner">
      <div className="pb-8">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="mt-8 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <table className="min-w-full divide-y divide-stone-700">
                  <thead>
                    <tr className="divide-x divide-stone-700">
                      <th
                        rowSpan={2}
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-stone-900 dark:text-stone-100 sm:pl-0 align-bottom"
                      >
                        Source
                      </th>
                      <th
                        rowSpan={2}
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-100 align-bottom table-cell"
                      >
                        Taken At
                      </th>
                      <th
                        colSpan={2}
                        scope="col"
                        className="px-3 py-3.5 text-sm font-semibold text-stone-900 dark:text-stone-100 text-center border-b border-b-stone-700 table-cell"
                      >
                        Head
                      </th>
                      <th
                        colSpan={2}
                        scope="col"
                        className="px-3 py-3.5 text-sm font-semibold text-stone-900 dark:text-stone-100 text-center border-b border-b-stone-700 table-cell sm:hidden"
                      >
                        Head Root
                      </th>
                      <th
                        colSpan={2}
                        scope="col"
                        className="px-3 py-3.5 text-sm font-semibold text-stone-900 dark:text-stone-100 text-center border-b border-b-stone-700 table-cell"
                      >
                        Finalized
                      </th>
                      <th
                        colSpan={2}
                        scope="col"
                        className="px-3 py-3.5 text-sm font-semibold text-stone-900 dark:text-stone-100 text-center border-b border-b-stone-700 table-cell"
                      >
                        Justified
                      </th>
                      <th
                        rowSpan={2}
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-100 align-bottom table-cell"
                      >
                        Snapshot ID
                      </th>
                      <th
                        rowSpan={2}
                        scope="col"
                        className="px-3 py-3.5 text-lefclearAllt text-sm font-semibold text-stone-900 dark:text-stone-100 align-bottom"
                      >
                        <span className="sr-only">View</span>
                      </th>
                    </tr>
                    <tr className="divide-x divide-stone-700">
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-100 border-l border-l-stone-700 table-cell"
                      >
                        Slot
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-100 table-cell"
                      >
                        Root
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-100 border-l border-l-stone-700 table-cell"
                      >
                        Epoch
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-100 table-cell"
                      >
                        Root
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-100 border-l border-l-stone-700 table-cell"
                      >
                        Epoch
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-100 table-cell"
                      >
                        Root
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800">
                    {results.map(({ data }, i) => {
                      if (!data)
                        return (
                          <tr key={i} className="divide-x divide-stone-700">
                            <td colSpan={10}>Data error</td>
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
                        <tr key={i} className="divide-x divide-stone-700">
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-semibold underline text-stone-900 dark:text-stone-100 sm:pl-0">
                            <Link href={`/node/${data.frame.metadata.node}`} onClick={clearAll}>
                              {data.frame.metadata.node}
                            </Link>
                            <ArrowTopRightOnSquareIcon className="inline h-5 w-5 pl-1" />
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-stone-900 dark:text-stone-100 table-cell">
                            <ReactTimeAgo date={new Date(data.frame.metadata.fetched_at)} />
                            <span className="pl-1">
                              ({new Date(data.frame.metadata.fetched_at).toISOString()})
                            </span>
                          </td>
                          <td
                            className={classNames(
                              'whitespace-nowrap px-3 py-4 text-sm font-semibold text-stone-900 dark:text-stone-100 table-cell',
                              isCanonicalHead
                                ? 'text-green-700 dark:text-green-300'
                                : 'text-red-700 dark:text-red-300',
                            )}
                          >
                            {head?.slot}
                          </td>
                          <td
                            className={classNames(
                              'whitespace-nowrap px-3 py-4 text-sm font-semibold text-stone-900 dark:text-stone-100 table-cell',
                              isCanonicalHead
                                ? 'text-green-700 dark:text-green-300'
                                : 'text-red-700 dark:text-red-300',
                            )}
                            title={head?.blockRoot}
                          >
                            {head?.blockRoot}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-stone-900 dark:text-stone-100 table-cell">
                            {data.frame.data.finalized_checkpoint?.epoch}
                          </td>
                          <td
                            className="whitespace-nowrap px-3 py-4 text-sm text-stone-900 dark:text-stone-100 table-cell"
                            title={data.frame.data.finalized_checkpoint?.root}
                          >
                            {data.frame.data.finalized_checkpoint?.root}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-stone-900 dark:text-stone-100 table-cell">
                            {data.frame.data.justified_checkpoint?.epoch}
                          </td>
                          <td
                            className="whitespace-nowrap px-3 py-4 text-sm text-stone-900 dark:text-stone-100 table-cell"
                            title={data.frame.data.justified_checkpoint?.root}
                          >
                            {data.frame.data.justified_checkpoint?.root}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-stone-900 dark:text-stone-100 table-cell font-semibold underline">
                            <Link href={`/snapshot/${data.frame.metadata.id}`} onClick={clearAll}>
                              {data.frame.metadata.id}
                            </Link>
                            <ArrowTopRightOnSquareIcon className="inline h-5 w-5 pl-1" />
                          </td>
                          <td className="relative whitespace-nowrap flex items-center gap-2 py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0 text-stone-900 dark:text-stone-100 ">
                            <Download
                              data={JSON.stringify(data.frame)}
                              filename={`snapshot-${data.frame.metadata.id}.json`}
                              className="w-10"
                            />
                            <Link href={`/node/${data.frame.metadata.node}`} onClick={clearAll}>
                              <MagnifyingGlassIcon className="w-10 h-10 p-2 cursor-pointer rounded transition hover:bg-stone-900/5 dark:hover:bg-white/5" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
