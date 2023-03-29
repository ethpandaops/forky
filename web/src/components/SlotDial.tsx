import React, { useMemo } from 'react';

import classNames from 'classnames';

import Ruler from '@components/Ruler';
import Slot from '@components/Slot';
import SnapshotMarker from '@components/SnapshotMarker';
import TimeDrag from '@components/TimeDrag';
import useFrameMeta from '@contexts/frameMeta';
import useTimeline from '@contexts/timeline';
import useWindowSize from '@hooks/useWindowSize';

const SUB_MARKS = 4;

const SlotDial = () => {
  const { secondsPerSlot, focusedSlot, focusedTimeIntoSlot, slotsPerEpoch } = useTimeline();
  const { padding } = useFrameMeta();
  const [width] = useWindowSize();

  const slotWidth = secondsPerSlot * 4 * (SUB_MARKS + 1);
  const slotPadding = Math.ceil(((width / slotWidth) * 1.25) / 2);
  const multiplier = 250 / (SUB_MARKS + 1);
  const middleSlotX = width / 2 - (slotWidth / (secondsPerSlot * 1000)) * focusedTimeIntoSlot;

  const leftSideRulers = Array.from(
    { length: focusedSlot < slotPadding ? focusedSlot : slotPadding },
    (_, i) => {
      return (
        <div key={i} className="fixed" style={{ left: middleSlotX - (i + 1) * slotWidth }}>
          <Slot slot={focusedSlot - i - 1} subMarks={SUB_MARKS} shouldFetch={i < padding} />
        </div>
      );
    },
  );

  const rightSideRulers = Array.from({ length: slotPadding }, (_, i) => {
    return (
      <div key={i} className="fixed" style={{ left: middleSlotX + (i + 1) * slotWidth }}>
        <Slot slot={focusedSlot + i + 1} subMarks={SUB_MARKS} shouldFetch={i < padding} />
      </div>
    );
  });

  return (
    <div className="cursor-col-resize select-none relative flex items-center justify-center w-screen overflow-hidden bg-stone-200 h-24">
      {leftSideRulers}
      <div className="fixed" style={{ left: middleSlotX }}>
        <Slot slot={focusedSlot} subMarks={SUB_MARKS} shouldFetch />
      </div>
      {rightSideRulers}
      <TimeDrag multiplier={multiplier} />
    </div>
  );
};

export default React.memo(SlotDial);
