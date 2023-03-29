import useFrameMeta from '@contexts/frameMeta';
import useFrames from '@contexts/frames';
import useTimeline from '@contexts/timeline';

interface State {
  slot?: number;
  id?: string;
}

export default function useActiveFrame(): State {
  const { focusedSlot, focusedTime } = useTimeline();
  const { frames } = useFrames();
  const { slots } = useFrameMeta();

  const state: State = {};
  // iterate backwards through slot meta data (max 5) until find latest focusedTime
  for (let i = 0; i > -5; i--) {
    const data = slots[focusedSlot + i];
    const slotData = data?.frames?.find(
      (frame) => new Date(frame.fetched_at).getTime() < focusedTime,
    );
    if (slotData) {
      state.slot = focusedSlot + i;
      state.id = slotData.id;
      break;
    }
  }

  return state;
}
