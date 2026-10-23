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
  const { slotDuration } = useEthereum();
  const { slot: focusedSlot, timeIntoSlot } = useFocus();
  const [width] = useWindowSize();

  const slotWidth = (slot: number) => slotDuration(slot) * MARKER_WIDTH * (SUB_MARKS + 1);
  const focusedSlotWidth = slotWidth(focusedSlot);
  const slotPadding = Math.ceil(((width / focusedSlotWidth) * 1.25) / 2);
  const multiplier = 250 / (SUB_MARKS + 1);
  const middleSlotX = width / 2 - (MARKER_WIDTH * (SUB_MARKS + 1) * timeIntoSlot) / 1000;

  const leftSideRulers: React.ReactNode[] = [];
  let leftX = middleSlotX;
  for (let i = 0; i < Math.min(focusedSlot, slotPadding); i++) {
    const slot = focusedSlot - i - 1;
    leftX -= slotWidth(slot);
    leftSideRulers.push(
      <div key={i} className="fixed" style={{ left: leftX }}>
        <Slot
          slot={slot}
          subMarks={SUB_MARKS}
          shouldFetch={i < PADDING}
          segments={slotWidth(slot) / MARKER_WIDTH}
        />
      </div>,
    );
  }

  const rightSideRulers: React.ReactNode[] = [];
  let rightX = middleSlotX + focusedSlotWidth;
  for (let i = 0; i < slotPadding; i++) {
    const slot = focusedSlot + i + 1;
    rightSideRulers.push(
      <div key={i} className="fixed" style={{ left: rightX }}>
        <Slot
          slot={slot}
          subMarks={SUB_MARKS}
          shouldFetch={i < PADDING}
          segments={slotWidth(slot) / MARKER_WIDTH}
        />
      </div>,
    );
    rightX += slotWidth(slot);
  }

  return (
    <div className="cursor-col-resize select-none relative flex items-center justify-center w-screen overflow-hidden bg-dial h-24">
      <TimeDrag multiplier={multiplier}>
        {leftSideRulers}
        <div className="absolute" style={{ left: middleSlotX }}>
          <Slot
            slot={focusedSlot}
            subMarks={SUB_MARKS}
            segments={focusedSlotWidth / MARKER_WIDTH}
            shouldFetch
          />
        </div>
        {rightSideRulers}
      </TimeDrag>
    </div>
  );
};

export default React.memo(SlotDial);
