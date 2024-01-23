import { memo, useMemo } from 'react';

import { Popover } from '@headlessui/react';
import classNames from 'classnames';

import { FrameMetaData } from '@app/types/api';
import useSelection from '@contexts/selection';

function SnapshotMarker({
  metadata,
  activeIds,
  percentage,
}: {
  metadata: FrameMetaData[];
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

      let color = 'bg-sky-400 dark:bg-sky-700';
      if (isReorg) {
        color = 'dark:bg-amber-400 bg-amber-700';
        if (isActive) {
          color = 'bg-amber-600 dark:bg-amber-500';
        }
      } else if (isActive) {
        color = 'bg-sky-600 dark:bg-sky-500';
      }

      segments.push(
        <div
          key={i}
          className={classNames(
            'w-1 h-full',
            color,
            `h-[${segmentHeight}%]`,
            i < numberOfSegments - 1
              ? 'border-b border-b-stone-200 dark:border-b-stone-600 border-b-opacity-25'
              : '',
            i === 0 && 'rounded-t-full',
            i === numberOfSegments - 1 && 'rounded-b-full',
          )}
          title={`${metadata[i].node} - ${metadata[i].id}`}
        />,
      );
    }

    return segments;
  }, [metadata]);

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
      <Popover.Button as="span" className="relative flex h-10 w-1 pt-2 cursor-pointer">
        <span className="relative flex flex-col rounded-full h-10 w-1">{segments}</span>
      </Popover.Button>
      <Popover.Panel className="fixed z-40 bottom-28 w-72 -ml-28 bg-stone-200 dark:bg-stone-800 shadow-lg rounded divide-y dark:divide-stone-700 cursor-pointer">
        {metadata.map((meta) => (
          <div
            key={meta.id}
            className="p-2 hover:bg-stone-300 dark:hover:bg-stone-700"
            onClick={() => setFrameId(meta.id)}
          >
            <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{meta.id}</div>
            <div className="text-sm text-stone-500 dark:text-stone-400">{meta.node}</div>
          </div>
        ))}
      </Popover.Panel>
    </Popover>
  );
}

export default memo(SnapshotMarker);
