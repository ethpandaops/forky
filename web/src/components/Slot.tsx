import React, { useMemo } from 'react';

import classNames from 'classnames';

import Ruler from '@components/Ruler';
import SnapshotMarker from '@components/SnapshotMarker';
import useEthereum from '@contexts/ethereum';
import useActiveFrame from '@hooks/useActiveFrame';
import { useMetadataQuery, useFrameQueries } from '@hooks/useQuery';

type Props = {
  subMarks: number;
  slot: number;
  shouldFetch?: boolean;
};

function Slot({ subMarks, slot, shouldFetch = false }: Props) {
  const { secondsPerSlot, genesisTime } = useEthereum();
  const { id } = useActiveFrame();

  const slotStart = useMemo<number>(() => {
    return genesisTime + slot * (secondsPerSlot * 1000);
  }, [genesisTime, slot, secondsPerSlot]);

  const { data, isLoading, error } = useMetadataQuery({ slot }, shouldFetch);
  // prefetch framess
  useFrameQueries(data?.map((frame) => frame.id) ?? [], Boolean(data) && shouldFetch);

  return (
    <Ruler
      className="h-24 shadow-[0_2px_2px_0_rgb(255,255,255,,0.55)]"
      marks={secondsPerSlot}
      subMarks={subMarks}
      summary={`SLOT ${slot}`}
      markText
      markSuffix="s"
    >
      <div
        className={classNames(
          'flex w-full h-full pt-1 pb-1 rounded',
          isLoading || error ? 'animate-pulse' : '',
        )}
      >
        <>
          {isLoading && <div className="bg-slate-400 w-full h-full"></div>}
          {/* TODO: handle error gracefully */}
          {error && <div className="bg-red-400 w-full h-full">Error</div>}
          {!isLoading &&
            !error &&
            data?.map((frame) => {
              const timeIntoSlot = new Date(frame.fetched_at).getTime() - slotStart;
              return (
                <SnapshotMarker
                  key={frame.id}
                  secondsPerSlot={secondsPerSlot}
                  timeIntoSlot={timeIntoSlot}
                  active={frame.id === id}
                />
              );
            })}
        </>
      </div>
    </Ruler>
  );
}

export default React.memo(Slot);
