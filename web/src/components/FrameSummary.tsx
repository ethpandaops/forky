import ReactTimeAgo from 'react-time-ago';

import Download from '@components/Download';
import Loading from '@components/Loading';
import { SummaryCard, SummaryLink, SummaryRow, SummarySection } from '@components/Summary';
import useSelection from '@contexts/selection';
import { useFrameQuery } from '@hooks/useQuery';
import { formatExtraDataValue } from '@utils/strings';

function parseLabel(label: string): [string, string | undefined] {
  const [key, value] = label.split('=', 2);
  return [key, value];
}

export default function FrameSummary({ id }: { id: string }) {
  const { clearAll } = useSelection();
  const { data, isLoading, error } = useFrameQuery(id);
  if (isLoading) {
    return <Loading message="Loading..." />;
  }

  if (!data || error) {
    return <Loading message={`Error: ${error ?? 'failed to load snapshot'}`} />;
  }

  return (
    <>
      <SummaryCard>
        <SummaryRow label="ID" mono>
          <SummaryLink href={`/snapshot/${data.frame.metadata.id}`} onClick={clearAll}>
            {data.frame.metadata.id}
          </SummaryLink>
        </SummaryRow>
        <SummaryRow label="Taken at">
          <ReactTimeAgo date={new Date(data.frame.metadata.fetched_at)} />
          <span className="pl-1.5 text-xs text-muted">
            {new Date(data.frame.metadata.fetched_at).toISOString()}
          </span>
        </SummaryRow>
        <SummaryRow label="Source">
          <SummaryLink href={`/node/${data.frame.metadata.node}`} onClick={clearAll}>
            {data.frame.metadata.node}
          </SummaryLink>
        </SummaryRow>
        <SummaryRow label="Wall clock epoch">{data.frame.metadata.wall_clock_epoch}</SummaryRow>
        <SummaryRow label="Wall clock slot">{data.frame.metadata.wall_clock_slot}</SummaryRow>
        <SummarySection title="Fork choice store" />
        <SummaryRow label="Justified checkpoint" mono>
          {formatExtraDataValue(data.frame.data.justified_checkpoint)}
        </SummaryRow>
        <SummaryRow label="Finalized checkpoint" mono>
          {formatExtraDataValue(data.frame.data.finalized_checkpoint)}
        </SummaryRow>
        {Object.entries(data.frame.data.extra_data ?? {}).map(([key, value]) => (
          <SummaryRow key={key} label={key.replaceAll('_', ' ')} mono>
            {formatExtraDataValue(value)}
          </SummaryRow>
        ))}
        {data.frame.metadata.labels && data.frame.metadata.labels.length > 0 && (
          <>
            <SummarySection title="Labels" />
            {data.frame.metadata.labels?.map(label => {
              const [key, value] = parseLabel(label);
              return (
                <SummaryRow key={key} label={key.replaceAll('_', ' ')}>
                  {value}
                </SummaryRow>
              );
            })}
          </>
        )}
      </SummaryCard>
      <div className="mt-4 flex w-full items-center justify-center text-foreground">
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
