import { memo, useMemo } from 'react';

import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import classNames from 'clsx';

import { FrameMetadata } from '@api';
import useSelection from '@contexts/selection';

function SnapshotMarker({
  metadata,
  activeIds,
  percentage,
}: {
  metadata: FrameMetadata[];
  activeIds: string[];
  percentage: string;
}) {
  const { setFrameId } = useSelection();

  const segments = useMemo(() => {
    const numberOfSegments = metadata.length;
    const segmentHeight = 100 / numberOfSegments;
    const segments = [];
    for (let i = 0; i < numberOfSegments; i++) {
      const isActive = activeIds.includes(metadata[i].id);
      const isReorg = metadata[i].event_source === 'xatu_reorg_event';

      let color = 'bg-marker-time';
      if (isReorg) {
        color = 'bg-marker';
        if (isActive) {
          color = 'bg-marker-active';
        }
      } else if (isActive) {
        color = 'bg-marker-time-active';
      }

      segments.push(
        <div
          key={i}
          className={classNames(
            'w-1 h-full',
            color,
            `h-[${segmentHeight}%]`,
            i === 0 && 'rounded-t-full',
            i === numberOfSegments - 1 && 'rounded-b-full',
          )}
          title={`${metadata[i].node} - ${metadata[i].id}`}
        />,
      );
    }

    return segments;
  }, [metadata, activeIds]);

  if (!segments.length) return null;

  if (segments.length === 1) {
    return (
      <div
        className="absolute"
        style={{
          left: `${percentage}%`,
        }}
      >
        <span
          className="relative flex h-10 w-1 pt-2 cursor-pointer"
          onClick={() => setFrameId(metadata[0].id)}
        >
          <span className="relative flex flex-col rounded-full h-10 w-1">{segments}</span>
        </span>
      </div>
    );
  }

  return (
    <Popover
      as="div"
      className="absolute"
      style={{
        left: `${percentage}%`,
      }}
    >
      <PopoverButton as="span" className="relative flex h-10 w-1 pt-2 cursor-pointer">
        <span className="relative flex flex-col rounded-full h-10 w-1">{segments}</span>
      </PopoverButton>
      <PopoverPanel className="fixed z-40 bottom-28 w-72 -ml-28 bg-surface-raised shadow-lg rounded divide-y dark:divide-border-strong cursor-pointer">
        {metadata.map(meta => (
          <div key={meta.id} className="p-2 hover:bg-track" onClick={() => setFrameId(meta.id)}>
            <div className="text-sm font-medium text-foreground">{meta.id}</div>
            <div className="text-sm text-muted">{meta.node}</div>
          </div>
        ))}
      </PopoverPanel>
    </Popover>
  );
}

export default memo(SnapshotMarker);
