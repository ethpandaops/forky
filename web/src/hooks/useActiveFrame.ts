import { useMemo } from 'react';

import { FrameMetaData } from '@app/types/api';
import useFocus from '@contexts/focus';
import { useMetadataQuery } from '@hooks/useQuery';

interface State {
  slot?: number;
  id?: string;
}

export function findPreviousFrame(
  focusedTime: number,
  metadata?: FrameMetaData[],
): State | undefined {
  const slotData = metadata
    ?.sort((a, b) => new Date(b.fetched_at).getTime() - new Date(a.fetched_at).getTime())
    .find((frame) => new Date(frame.fetched_at).getTime() < focusedTime);

  if (slotData) {
    return {
      slot: slotData.wall_clock_slot,
      id: slotData.id,
    };
  }

  return undefined;
}

export default function useActiveFrame(): State {
  const { slot: focusedSlot, time: focusedTime } = useFocus();
  const { data: metadataCurrent } = useMetadataQuery({
    slot: focusedSlot,
  });
  const { data: metadataMinus1 } = useMetadataQuery({
    slot: focusedSlot - 1,
  });
  const { data: metadataMinus2 } = useMetadataQuery({
    slot: focusedSlot - 2,
  });

  return useMemo(() => {
    const stateCurrentSlot = findPreviousFrame(focusedTime, metadataCurrent);
    if (stateCurrentSlot) return stateCurrentSlot;

    const stateMinus1Slot = findPreviousFrame(focusedTime, metadataMinus1);
    if (stateMinus1Slot) return stateMinus1Slot;

    const stateMinus2Slot = findPreviousFrame(focusedTime, metadataMinus2);
    if (stateMinus2Slot) return stateMinus2Slot;

    return {};
  }, [focusedTime, metadataCurrent, metadataMinus1, metadataMinus2]);
}
