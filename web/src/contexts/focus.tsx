import { useContext as reactUseContext, createContext, useCallback, useState } from 'react';

import useEthereum from '@contexts/ethereum';

export const Context = createContext<State | undefined>(undefined);

export default function useContext() {
  const context = reactUseContext(Context);
  if (context === undefined) {
    throw new Error('Focus context must be used within a Focus provider');
  }
  return context;
}

export interface State {
  time: number;
  setTime: (time: number) => void;
  shiftTime: (delta: number) => void;
  setSlot: (slot: number) => void;
  setEpoch: (epoch: number) => void;
  slot: number;
  epoch: number;
  timeIntoSlot: number;
  timeIntoEpoch: number;
}

export interface ValueProps {
  initialTime: number;
}

export function useValue(props: ValueProps): State {
  const [time, setTime] = useState(props.initialTime);
  const { secondsPerSlot, slotsPerEpoch, genesisTime } = useEthereum();

  const setTimeWrapper = useCallback(
    (time: number) => {
      setTime(time < genesisTime ? genesisTime : time);
    },
    [genesisTime, setTime],
  );

  const setSlot = useCallback(
    (targetSlot: number) => {
      if (targetSlot < 0) return;
      setTimeWrapper(genesisTime + targetSlot * secondsPerSlot * 1000);
    },
    [setTimeWrapper, genesisTime, secondsPerSlot],
  );

  const setEpoch = useCallback(
    (targetEpoch: number) => {
      if (targetEpoch < 0) return;
      setTimeWrapper(genesisTime + targetEpoch * slotsPerEpoch * secondsPerSlot * 1000);
    },
    [setTimeWrapper, genesisTime, secondsPerSlot, slotsPerEpoch],
  );

  const timeDiff = (time - genesisTime) / 1000;
  const slot = Math.floor(timeDiff / secondsPerSlot);
  const epoch = Math.floor(slot / slotsPerEpoch);
  const timeIntoSlot = Math.ceil((timeDiff % secondsPerSlot) * 1000);
  const timeIntoEpoch = (slot % slotsPerEpoch) * secondsPerSlot * 1000 + timeIntoSlot;

  const shiftTime = useCallback((delta: number) => setTimeWrapper(time + delta), [time]);

  return {
    time,
    setTime: setTimeWrapper,
    shiftTime,
    setSlot,
    setEpoch,
    slot,
    epoch,
    timeIntoSlot,
    timeIntoEpoch,
  };
}
