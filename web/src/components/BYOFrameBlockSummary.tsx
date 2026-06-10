import ReactTimeAgo from 'react-time-ago';

import Download from '@components/Download';
import Loading from '@components/Loading';
import { SummaryCard, SummaryRow, SummarySection, ValidityBadge } from '@components/Summary';
import useEthereum from '@contexts/ethereum';
import useFocus from '@contexts/focus';
import { FrameBlock } from '@contexts/selection';

export default function BYOFrameBlockSummary({ blockRoot }: FrameBlock) {
  const { byoData: data } = useFocus();
  const { slotsPerEpoch } = useEthereum();

  if (!data) {
    return <Loading message="Error: failed to load graph data" />;
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
          data={JSON.stringify(data.frame.data, null, 2)}
          filename={`snapshot-byo.json`}
          size="md"
          text="Snapshot"
        />
      </div>
    </>
  );
}
