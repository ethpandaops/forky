import React from 'react';

import Slot from '@components/Slot';
import TimeDrag from '@components/TimeDrag';
import useEthereum from '@contexts/ethereum';
import useFocus from '@contexts/focus';
import useWindowSize from '@hooks/useWindowSize';

const SUB_MARKS = 4;
const PADDING = 2;
const MARKER_WIDTH = 4;

const SlotDial = () => {
  const { secondsPerSlot } = useEthereum();
  const { slot: focusedSlot, timeIntoSlot } = useFocus();
  const [width] = useWindowSize();

  const slotWidth = secondsPerSlot * MARKER_WIDTH * (SUB_MARKS + 1);
  const segments = slotWidth / MARKER_WIDTH;
  const slotPadding = Math.ceil(((width / slotWidth) * 1.25) / 2);
  const multiplier = 250 / (SUB_MARKS + 1);
  const middleSlotX = width / 2 - (slotWidth / (secondsPerSlot * 1000)) * timeIntoSlot;

  const leftSideRulers = Array.from(
    { length: focusedSlot < slotPadding ? focusedSlot : slotPadding },
    (_, i) => {
      return (
        <div key={i} className="fixed" style={{ left: middleSlotX - (i + 1) * slotWidth }}>
          <Slot
            slot={focusedSlot - i - 1}
            subMarks={SUB_MARKS}
            shouldFetch={i < PADDING}
            segments={segments}
          />
        </div>
      );
    },
  );

  const rightSideRulers = Array.from({ length: slotPadding }, (_, i) => {
    return (
      <div key={i} className="fixed" style={{ left: middleSlotX + (i + 1) * slotWidth }}>
        <Slot
          slot={focusedSlot + i + 1}
          subMarks={SUB_MARKS}
          shouldFetch={i < PADDING}
          segments={segments}
        />
      </div>
    );
  });

  return (
    <div className="cursor-col-resize select-none relative flex items-center justify-center w-screen overflow-hidden bg-stone-200 h-24">
      <TimeDrag multiplier={multiplier}>
        {leftSideRulers}
        <div className="absolute" style={{ left: middleSlotX }}>
          <Slot slot={focusedSlot} subMarks={SUB_MARKS} segments={segments} shouldFetch />
        </div>
        {rightSideRulers}
      </TimeDrag>
    </div>
  );
};

export default React.memo(SlotDial);
