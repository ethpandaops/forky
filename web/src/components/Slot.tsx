import React, { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';
import classNames from 'classnames';

import { Response, V1MetadataListRequest, V1MetadataListResponse } from '@app/types/api';
import Ruler from '@components/Ruler';
import SnapshotMarker from '@components/SnapshotMarker';
import useFrameMeta from '@contexts/frameMeta';
import useNetwork from '@contexts/network';
import useTimeline from '@contexts/timeline';
import useActiveFrame from '@hooks/useActiveFrame';
import useSlotMeta from '@hooks/useSlotMeta';

type Props = {
  subMarks: number;
  slot: number;
  shouldFetch?: boolean;
};

const fetchSlotData = async (
  slot: number,
  node?: string,
): Promise<Response<V1MetadataListResponse>> => {
  const payload: V1MetadataListRequest = {
    filter: {
      slot,
      node,
    },
    pagination: {
      offset: 0,
      limit: 1000,
    },
  };

  const response = await fetch('api/v1/metadata', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch slot data');
  }
  return response.json();
};

function Slot({ subMarks, slot, shouldFetch = false }: Props) {
  const { node, secondsPerSlot, genesisTime } = useNetwork();
  const data = useSlotMeta(slot);
  const { updateSlot } = useFrameMeta();
  const { id } = useActiveFrame();

  const slotStart = useMemo<number>(() => {
    return genesisTime + slot * (secondsPerSlot * 1000);
  }, [genesisTime, slot, secondsPerSlot]);

  const { isLoading, error } = useQuery<Response<V1MetadataListResponse>>(
    ['slotData', slot],
    () => fetchSlotData(slot, node),
    {
      enabled:
        shouldFetch &&
        // TODO: cleanup
        (!data || (!data?.frames?.length && new Date().getTime() - data?.lastFetched > 6000)),
      onSuccess: (data) => {
        if (data) {
          updateSlot(slot, data.data?.frames);
        }
      },
    },
  );

  return (
    <Ruler
      className="h-24"
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
          {data &&
            data?.frames?.map((frame) => {
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
