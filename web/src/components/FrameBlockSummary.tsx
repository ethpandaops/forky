import ReactTimeAgo from 'react-time-ago';

import Download from '@components/Download';
import Loading from '@components/Loading';
import {
  SummaryCard,
  SummaryLink,
  SummaryRow,
  SummarySection,
  ValidityBadge,
} from '@components/Summary';
import useEthereum from '@contexts/ethereum';
import useSelection, { FrameBlock } from '@contexts/selection';
import { useFrameQuery } from '@hooks/useQuery';

export default function FrameBlockSummary({ frameId, blockRoot }: FrameBlock) {
  const { clearAll } = useSelection();
  const { slotsPerEpoch } = useEthereum();
  const { data, isLoading, error } = useFrameQuery(frameId);
  if (isLoading) {
    return <Loading message="Loading..." />;
  }

  if (!data || error) {
    return <Loading message={`Error: ${error ?? 'failed to load snapshot'}`} />;
  }

  const node = data.frame?.data?.fork_choice_nodes?.find(n => n.block_root === blockRoot);

  if (!node) {
    return <Loading message="Error: failed to find block root in snapshot" />;
  }

  return (
    <>
      <SummaryCard>
        <SummaryRow label="Epoch">
          {Math.floor(Number.parseInt(node.slot) / slotsPerEpoch)}
        </SummaryRow>
        <SummaryRow label="Slot">{node.slot}</SummaryRow>
        <SummaryRow label="Snapshot time">
          <ReactTimeAgo date={new Date(data.frame.metadata.fetched_at)} />
          <span className="pl-1.5 text-xs text-muted">{data.frame.metadata.fetched_at}</span>
        </SummaryRow>
        <SummaryRow label="Snapshot ID" mono>
          <SummaryLink href={`/snapshot/${data.frame.metadata.id}`} onClick={clearAll}>
            {data.frame.metadata.id}
          </SummaryLink>
        </SummaryRow>
        <SummaryRow label="Source">
          <SummaryLink href={`/node/${data.frame.metadata.node}`} onClick={clearAll}>
            {data.frame.metadata.node}
          </SummaryLink>
        </SummaryRow>
        <SummaryRow label="Block root" mono>
          {node.block_root}
        </SummaryRow>
        <SummaryRow label="Parent root" mono>
          {node.parent_root}
        </SummaryRow>
        <SummaryRow label="Execution block hash" mono>
          {node.execution_block_hash}
        </SummaryRow>
        <SummaryRow label="Weight" mono>
          {node.weight}
        </SummaryRow>
        <SummaryRow label="Validity">
          <ValidityBadge validity={node.validity} />
        </SummaryRow>
        <SummaryRow label="Justified epoch">{node.justified_epoch}</SummaryRow>
        <SummaryRow label="Finalized epoch">{node.finalized_epoch}</SummaryRow>
        {node.extra_data && (
          <>
            <SummarySection title="Extra data" />
            {Object.entries(node.extra_data).map(([key, value]) => (
              <SummaryRow key={key} label={key.replaceAll('_', ' ')} mono>
                {`${value}`}
              </SummaryRow>
            ))}
          </>
        )}
      </SummaryCard>
      <div className="mt-4 flex w-full items-center justify-center gap-4 text-foreground">
        <Download
          data={JSON.stringify(node, null, 2)}
          filename={`block-${node.block_root}.json`}
          size="md"
          text="Block"
        />
        <Download
          data={JSON.stringify(data.frame, null, 2)}
          filename={`snapshot-${data.frame.metadata.id}.json`}
          size="md"
          text="Snapshot"
        />
      </div>
    </>
  );
}
