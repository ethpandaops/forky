import { CheckCircleIcon, MagnifyingGlassIcon, XCircleIcon } from '@heroicons/react/20/solid';
import classNames from 'clsx';
import Link from '@components/Link';

import { ProcessedData, WeightedNodeAttributes } from '@app/types/graph';
import Loading from '@components/Loading';
import { SummaryCard, SummaryLink, SummaryRow, SummarySection } from '@components/Summary';
import useEthereum from '@contexts/ethereum';
import useSelection, { AggregatedFramesBlock } from '@contexts/selection';
import { useFrameQueries } from '@hooks/useQuery';
import { aggregateProcessedData } from '@utils/graph';

const HEADER_CELL = 'px-3 py-2 text-center text-xs font-semibold text-foreground';
const ICON_CELL = 'whitespace-nowrap py-2 text-sm text-muted';

export default function AggregatedBlockSummary({ frameIds, blockRoot }: AggregatedFramesBlock) {
  const { slotsPerEpoch } = useEthereum();
  const { clearAll, setFrameBlock } = useSelection();
  const results = useFrameQueries(frameIds);
  if (results.some(r => r.isLoading)) {
    return <Loading message="Loading..." />;
  }

  const graph = aggregateProcessedData(
    results.reduce<ProcessedData[]>((acc, { data }) => {
      if (data) acc.push(data);
      return acc;
    }, []),
  );
  const nodeId = graph.nodes().find(id => graph.getNodeAttribute(id, 'blockRoot') === blockRoot);
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
    <SummaryCard>
      <SummaryRow label="Epoch">{Math.floor(node.slot / slotsPerEpoch)}</SummaryRow>
      <SummaryRow label="Slot">{node.slot}</SummaryRow>
      <SummaryRow label="Block root" mono>
        {node.blockRoot}
      </SummaryRow>
      <SummarySection title="Status" />
      <div className="px-4 pb-3 sm:px-5">
        <table className="min-w-full divide-y divide-border-strong">
          <thead>
            <tr>
              <th scope="col" className="py-2 pr-3 text-left text-xs font-semibold text-foreground">
                Source
              </th>
              <th scope="col" className={HEADER_CELL} title="Sources have this block as canonical">
                Canonical
              </th>
              <th scope="col" className={HEADER_CELL} title="Sources have seen this block">
                Seen
              </th>
              {hasFinalized && (
                <th
                  scope="col"
                  className={HEADER_CELL}
                  title="Sources have this block as a finalized checkpoint"
                >
                  Finalized
                </th>
              )}
              {hasJustified && (
                <th
                  scope="col"
                  className={HEADER_CELL}
                  title="Sources have this block as a justified checkpoint"
                >
                  Justified
                </th>
              )}
              {hasInvalid && (
                <th scope="col" className={HEADER_CELL} title="Sources have this block as valid">
                  Validity
                </th>
              )}
              {hasOrphaned && (
                <th
                  scope="col"
                  className={HEADER_CELL}
                  title="Detached block means the source has the parent of this block before the finalized checkpoint"
                >
                  Detached
                </th>
              )}
              <th scope="col" className="relative py-2 pl-3">
                <span className="sr-only">View</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
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
                  <td className="whitespace-nowrap py-2 pr-3 text-sm">
                    <SummaryLink href={`/node/${data.frame.metadata.node}`} onClick={clearAll}>
                      {data.frame.metadata.node}
                    </SummaryLink>
                  </td>
                  <td className={ICON_CELL}>
                    <div className="flex w-full justify-center">
                      {seen &&
                        (canonical ? (
                          <CheckCircleIcon
                            className={classNames(
                              'h-5 w-5',
                              isAggregatedCanonical && 'text-success',
                              !isAggregatedCanonical && 'text-warning',
                            )}
                          />
                        ) : (
                          <XCircleIcon
                            className={classNames(
                              'h-5 w-5',
                              !isAggregatedCanonical && 'text-success',
                              isAggregatedCanonical && 'text-warning',
                            )}
                          />
                        ))}
                    </div>
                  </td>
                  <td className={ICON_CELL}>
                    <div className="flex w-full justify-center">
                      {seen ? (
                        <CheckCircleIcon
                          className={classNames(
                            'h-5 w-5',
                            isAggregatedCanonical && 'text-success',
                            !isAggregatedCanonical && 'text-warning',
                          )}
                        />
                      ) : (
                        <XCircleIcon
                          className={classNames(
                            'h-5 w-5',
                            !isAggregatedCanonical && 'text-muted',
                            isAggregatedCanonical && 'text-warning',
                          )}
                        />
                      )}
                    </div>
                  </td>
                  {hasFinalized && (
                    <td className={ICON_CELL}>
                      <div className="flex w-full justify-center">
                        {attributes?.checkpoint === 'finalized' ? (
                          <CheckCircleIcon className="h-5 w-5 text-success" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-warning" />
                        )}
                      </div>
                    </td>
                  )}
                  {hasJustified && (
                    <td className={ICON_CELL}>
                      <div className="flex w-full justify-center">
                        {attributes?.checkpoint === 'justified' ? (
                          <CheckCircleIcon className="h-5 w-5 text-success" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-warning" />
                        )}
                      </div>
                    </td>
                  )}
                  {hasInvalid && (
                    <td className={ICON_CELL}>
                      <div className="flex w-full justify-center">
                        {validity.toLowerCase() === 'valid' ? (
                          <CheckCircleIcon className="h-5 w-5 text-success" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-warning" />
                        )}
                      </div>
                    </td>
                  )}
                  {hasOrphaned && (
                    <td className={ICON_CELL}>
                      <div className="flex w-full justify-center">
                        {orphaned ? (
                          <CheckCircleIcon className="h-5 w-5 text-warning" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-success" />
                        )}
                      </div>
                    </td>
                  )}
                  <td className="whitespace-nowrap py-2 font-medium text-foreground">
                    {attributes && (
                      <div className="flex justify-end">
                        <Link
                          href={`/snapshot/${data.frame.metadata.id}`}
                          onClick={() =>
                            setFrameBlock({ blockRoot, frameId: data.frame.metadata.id })
                          }
                        >
                          <MagnifyingGlassIcon className="h-8 w-8 cursor-pointer rounded-md p-1.5 transition hover:bg-overlay/5" />
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
    </SummaryCard>
  );
}
