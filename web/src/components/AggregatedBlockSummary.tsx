import {
  CheckCircleIcon,
  MagnifyingGlassIcon,
  XCircleIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/20/solid';
import classNames from 'classnames';
import { Link } from 'wouter';

import { ProcessedData, WeightedNodeAttributes } from '@app/types/graph';
import { truncateHash } from '@app/utils/strings';
import Loading from '@components/Loading';
import useEthereum from '@contexts/ethereum';
import useSelection, { AggregatedFramesBlock } from '@contexts/selection';
import { useFrameQueries } from '@hooks/useQuery';
import { aggregateProcessedData } from '@utils/graph';

export default function AggregatedBlockSummary({ frameIds, blockRoot }: AggregatedFramesBlock) {
  const { slotsPerEpoch } = useEthereum();
  const { clearAll, setFrameBlock } = useSelection();
  const results = useFrameQueries(frameIds);
  if (results.some((r) => r.isLoading)) {
    return <Loading message="Loading..." />;
  }

  const graph = aggregateProcessedData(
    results.reduce<ProcessedData[]>((acc, { data }) => {
      if (data) acc.push(data);
      return acc;
    }, []),
  );
  const nodeId = graph.nodes().find((id) => graph.getNodeAttribute(id, 'blockRoot') === blockRoot);
  const node = nodeId ? graph.getNodeAttributes(nodeId) : undefined;

  if (!node) {
    return <Loading message="Error: failed to find block root in snapshot" />;
  }

  const hasInvalid = node.validities.some(({ validity }) => validity.toLowerCase() !== 'valid');
  const hasOrphaned = node.orphaned.length > 0;
  const [hasFinalized, hasJustified] = node.checkpoints.reduce(
    ([hasFinalized, hasJustified], { checkpoint }) => {
      if (checkpoint === 'finalized') return [true, hasJustified];
      if (checkpoint === 'justified') return [hasFinalized, true];
      return [hasFinalized, hasJustified];
    },
    [false, false],
  );

  return (
    <div className="bg-stone-50 dark:bg-stone-800 shadow dark:shadow-inner">
      <div className="border-t border-stone-200 dark:border-b dark:border-stone-800 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-stone-200 dark:divide-stone-900">
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-stone-500 dark:text-stone-300">Epoch</dt>
            <dd className="mt-1 text-sm text-stone-900 dark:text-stone-100 sm:mt-0 sm:col-span-4">
              {Math.floor(node.slot / slotsPerEpoch)}
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-stone-500 dark:text-stone-300">Slot</dt>
            <dd className="mt-1 text-sm text-stone-900 dark:text-stone-100 sm:mt-0 sm:col-span-4">
              {node.slot}
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-stone-500 dark:text-stone-300">Block Root</dt>
            <dd className="mt-1 text-sm text-stone-900 dark:text-stone-100 sm:mt-0 sm:col-span-4">
              <span className="lg:hidden font-mono flex">
                <span className="relative top-1 group transition duration-300 cursor-pointer">
                  {truncateHash(node.blockRoot)}
                  <span className="relative -top-0.5 block max-w-0 group-hover:max-w-full transition-all duration-500 h-0.5 bg-emerald-400"></span>
                </span>
              </span>
              <span className="hidden lg:table-cell font-mono">{node.blockRoot}</span>
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:px-6 flex justify-center sm:justify-start sm:bg-stone-100 sm:dark:bg-stone-900">
            <dt className="text-md text-stone-500 dark:text-stone-300 font-bold">Status</dt>
          </div>
          <div className="sm:px-6 py-2">
            <table className="min-w-full divide-y divide-stone-700">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-stone-900 dark:text-stone-100 sm:pl-0"
                  >
                    Source
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-sm font-semibold text-stone-900 dark:text-stone-100 text-center"
                    title="Sources have this block as canonical"
                  >
                    Canonical
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-sm font-semibold text-stone-900 dark:text-stone-100 text-center"
                    title="Sources have seen this block"
                  >
                    Seen
                  </th>
                  {hasFinalized && (
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-sm font-semibold text-stone-900 dark:text-stone-100 text-center"
                      title="Sources have this block as a finalized checkpoint"
                    >
                      Finalized
                    </th>
                  )}
                  {hasJustified && (
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-sm font-semibold text-stone-900 dark:text-stone-100 text-center"
                      title="Sources have this block as a justified checkpoint"
                    >
                      Justified
                    </th>
                  )}
                  {hasInvalid && (
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-sm font-semibold text-stone-900 dark:text-stone-100 text-center"
                      title="Sources have this block as valid"
                    >
                      Validity
                    </th>
                  )}
                  {hasOrphaned && (
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-sm font-semibold text-stone-900 dark:text-stone-100 text-center"
                      title="Detached block means the source has the parent of this block before the finalized checkpoint"
                    >
                      Detached
                    </th>
                  )}
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                    <span className="sr-only">View</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {results.map(({ data }) => {
                  if (!data) return null;
                  let isAggregatedCanonical = false;
                  let seen = false;
                  let canonical = false;
                  let validity = 'valid';
                  let orphaned = false;
                  let attributes: WeightedNodeAttributes | undefined;
                  try {
                    const aggregatedAttributes = graph.getNodeAttributes(nodeId);
                    isAggregatedCanonical = aggregatedAttributes.canonical;
                    attributes = data.graph.getNodeAttributes(nodeId);
                    validity = attributes.validity;
                    orphaned = attributes.orphaned || false;
                    seen = true;
                    canonical = attributes.canonical;
                  } catch (err) {
                    // ignore
                  }
                  return (
                    <tr key={data.frame.metadata.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-semibold underline text-stone-900 dark:text-stone-100 sm:pl-0">
                        <Link href={`/node/${data.frame.metadata.node}`} onClick={clearAll}>
                          {data.frame.metadata.node}
                        </Link>
                        <ArrowTopRightOnSquareIcon className="inline h-5 w-5 pl-1" />
                      </td>
                      <td className="whitespace-nowrap py-4 text-sm text-stone-300">
                        <div className="w-full flex justify-center">
                          {seen &&
                            (canonical ? (
                              <CheckCircleIcon
                                className={classNames(
                                  'w-6 h-6',
                                  isAggregatedCanonical && 'text-green-700 dark:text-green-300',
                                  !isAggregatedCanonical && 'text-amber-500 dark:text-amber-300',
                                )}
                              />
                            ) : (
                              <XCircleIcon
                                className={classNames(
                                  'w-6 h-6',
                                  !isAggregatedCanonical && 'text-green-700 dark:text-green-300',
                                  isAggregatedCanonical && 'text-amber-500 dark:text-amber-300',
                                )}
                              />
                            ))}
                        </div>
                      </td>
                      <td className="whitespace-nowrap py-4 text-sm text-stone-300">
                        <div className="w-full flex justify-center">
                          {seen ? (
                            <CheckCircleIcon
                              className={classNames(
                                'w-6 h-6',
                                isAggregatedCanonical && 'text-green-700 dark:text-green-300',
                                !isAggregatedCanonical && 'text-amber-500 dark:text-amber-300',
                              )}
                            />
                          ) : (
                            <XCircleIcon
                              className={classNames(
                                'w-6 h-6',
                                !isAggregatedCanonical && 'text-stone-700 dark:text-stone-300',
                                isAggregatedCanonical && 'text-amber-500 dark:text-amber-300',
                              )}
                            />
                          )}
                        </div>
                      </td>
                      {hasFinalized && (
                        <td className="whitespace-nowrap py-4 text-sm text-stone-300">
                          <div className="w-full flex justify-center">
                            {attributes?.checkpoint === 'finalized' ? (
                              <CheckCircleIcon className="w-6 h-6 text-green-700 dark:text-green-300" />
                            ) : (
                              <XCircleIcon className="w-6 h-6 text-amber-500 dark:text-amber-300" />
                            )}
                          </div>
                        </td>
                      )}
                      {hasJustified && (
                        <td className="whitespace-nowrap py-4 text-sm text-stone-300">
                          <div className="w-full flex justify-center">
                            {attributes?.checkpoint === 'justified' ? (
                              <CheckCircleIcon className="w-6 h-6 text-green-700 dark:text-green-300" />
                            ) : (
                              <XCircleIcon className="w-6 h-6 text-amber-500 dark:text-amber-300" />
                            )}
                          </div>
                        </td>
                      )}
                      {hasInvalid && (
                        <td className="whitespace-nowrap py-4 text-sm text-stone-300">
                          <div className="w-full flex justify-center">
                            {validity.toLowerCase() === 'valid' ? (
                              <CheckCircleIcon className="w-6 h-6 text-green-700 dark:text-green-300" />
                            ) : (
                              <XCircleIcon className="w-6 h-6 text-amber-500 dark:text-amber-300" />
                            )}
                          </div>
                        </td>
                      )}
                      {hasOrphaned && (
                        <td className="whitespace-nowrap py-4 text-sm text-stone-300">
                          <div className="w-full flex justify-center">
                            {orphaned ? (
                              <CheckCircleIcon className="w-6 h-6 text-amber-500 dark:text-amber-300" />
                            ) : (
                              <XCircleIcon className="w-6 h-6 text-green-700 dark:text-green-300" />
                            )}
                          </div>
                        </td>
                      )}
                      <td className="whitespace-nowrap py-4 font-medium text-stone-900 dark:text-stone-100">
                        {attributes && (
                          <div className="flex justify-end">
                            <Link
                              href={`/snapshot/${data.frame.metadata.id}`}
                              onClick={() =>
                                setFrameBlock({ blockRoot, frameId: data.frame.metadata.id })
                              }
                            >
                              <MagnifyingGlassIcon className="w-10 h-10 p-2 cursor-pointer rounded transition hover:bg-stone-900/5 dark:hover:bg-white/5" />
                            </Link>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </dl>
      </div>
    </div>
  );
}
