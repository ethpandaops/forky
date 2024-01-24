import React, { useMemo, ReactNode } from 'react';

import classNames from 'classnames';

import { FrameMetaData } from '@app/types/api';
import Ruler from '@components/Ruler';
import SnapshotMarker from '@components/SnapshotMarker';
import useEthereum from '@contexts/ethereum';
import useFocus from '@contexts/focus';
import useActive from '@hooks/useActive';
import { useMetadataQuery, useFrameQueries } from '@hooks/useQuery';

type Props = {
  subMarks: number;
  segments: number;
  slot: number;
  shouldFetch?: boolean;
};

function Slot({ subMarks, slot, shouldFetch = false, segments }: Props) {
  const { secondsPerSlot, genesisTime } = useEthereum();
  const { node } = useFocus();
  const { ids } = useActive();

  const slotStart = useMemo<number>(() => {
    return genesisTime + slot * (secondsPerSlot * 1000);
  }, [genesisTime, slot, secondsPerSlot]);

  const { data, isLoading, error } = useMetadataQuery({ slot }, shouldFetch);
  // prefetch framess
  useFrameQueries(data?.map((frame) => frame.id) ?? [], Boolean(data) && shouldFetch);

  const groupedMarkers = useMemo<ReactNode[]>(() => {
    const groupSize = 100 / segments;
    const groups =
      data?.reduce<Record<number, FrameMetaData[]>>((acc, frame) => {
        if (node && frame.node !== node) return acc;
        const timeIntoSlot = new Date(frame.fetched_at).getTime() - slotStart;

        const leftPercentage = (timeIntoSlot / (secondsPerSlot * 1000)) * 100;
        const groupIndex = Math.floor(leftPercentage / groupSize);
        const group = groupIndex * groupSize + groupSize / 2;
        if (!acc[group]) {
          acc[group] = [];
        }
        acc[group].push(frame);
        return acc;
      }, {}) ?? {};

    return Object.entries(groups).map(([group, metadata]) => (
      <SnapshotMarker key={`${group}`} percentage={group} metadata={metadata} activeIds={ids} />
    ));
  }, [data?.map(({ id }) => id).join('-') ?? '', node, JSON.stringify(ids)]);

  return (
    <Ruler
      className={classNames(
        'h-24 shadow-inner-xl',
        isLoading && shouldFetch && 'animate-pulse dark:animate-pulse-light',
        isLoading
          ? 'bg-stone-200 dark:bg-stone-800/95'
          : error
            ? 'bg-rose-200 dark:bg-rose-950/95'
            : 'bg-stone-300 dark:bg-stone-800',
      )}
      marks={secondsPerSlot}
      subMarks={subMarks}
      summary={`SLOT ${slot}`}
      markText
      markSuffix="s"
    >
      <div className={classNames('flex w-full h-full pt-1 pb-1 rounded')}>
        {!isLoading && !error && groupedMarkers}
      </div>
    </Ruler>
  );
}

export default React.memo(Slot);
