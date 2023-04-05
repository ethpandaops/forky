import { memo } from 'react';

import Ruler from '@components/Ruler';
import TimeDrag from '@components/TimeDrag';
import useEthereum from '@contexts/ethereum';
import useFocus from '@contexts/focus';
import useWindowSize from '@hooks/useWindowSize';

const SUB_MARKS = 0;

function SlotDial() {
  const { slotsPerEpoch, secondsPerSlot } = useEthereum();
  const { epoch: focusedEpoch, timeIntoEpoch: focusedTimeIntoEpoch } = useFocus();
  const [width] = useWindowSize();

  const epochWidth = slotsPerEpoch * 4 * (SUB_MARKS + 1);
  const epochPadding = Math.ceil(((width / epochWidth) * 1.25) / 2);
  const multiplier = (250 / (SUB_MARKS + 1)) * secondsPerSlot;
  const middleSlotX =
    width / 2 - (epochWidth / (slotsPerEpoch * secondsPerSlot * 1000)) * focusedTimeIntoEpoch;

  const leftSideRulers = Array.from(
    { length: focusedEpoch < epochPadding ? focusedEpoch : epochPadding },
    (_, i) => {
      return (
        <div key={i} className="fixed" style={{ left: middleSlotX - (i + 1) * epochWidth }}>
          <Ruler
            className="h-10"
            marks={slotsPerEpoch}
            summary={`EPOCH ${focusedEpoch - i - 1}`}
            subMarks={SUB_MARKS}
            flip
          />
        </div>
      );
    },
  );

  const rightSideRulers = Array.from({ length: epochPadding }, (_, i) => {
    return (
      <div key={i} className="fixed" style={{ left: middleSlotX + (i + 1) * epochWidth }}>
        <Ruler
          className="h-10"
          marks={slotsPerEpoch}
          summary={`EPOCH ${focusedEpoch + i + 1}`}
          subMarks={SUB_MARKS}
          flip
        />
      </div>
    );
  });

  return (
    <div className="cursor-col-resize select-none relative flex items-center justify-center w-screen overflow-hidden bg-stone-200 h-10">
      {leftSideRulers}
      <div className="fixed" style={{ left: middleSlotX }}>
        <Ruler
          className="h-10"
          marks={slotsPerEpoch}
          summary={`EPOCH ${focusedEpoch}`}
          subMarks={SUB_MARKS}
          flip
        />
      </div>
      {rightSideRulers}
      <TimeDrag multiplier={multiplier} />
    </div>
  );
}

export default memo(SlotDial);
