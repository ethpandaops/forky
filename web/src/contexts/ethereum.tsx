import { useContext as reactUseContext, createContext, useCallback, useState } from 'react';

import {
  slotAtTime as scheduleSlotAtTime,
  slotDuration as scheduleSlotDuration,
  slotStartTime as scheduleSlotStartTime,
} from '@utils/slots';

export const Context = createContext<State | undefined>(undefined);

export default function useContext() {
  const context = reactUseContext(Context);
  if (context === undefined) {
    throw new Error('Ethereum context must be used within a Ethereum provider');
  }
  return context;
}

export interface State {
  secondsPerSlot: number;
  setSecondsPerSlot: (secondsPerSlot: number) => void;
  slotsPerEpoch: number;
  setSlotsPerEpoch: (slotsPerEpoch: number) => void;
  genesisTime: number;
  setGenesisTime: (genesisTime: number) => void;
  networkName: string;
  setNetworkName: (networkName: string) => void;
  slotDuration: (slot: number) => number;
  slotStartTime: (slot: number) => number;
  slotAtTime: (time: number) => number;
}

export interface ValueProps {
  secondsPerSlot: number;
  slotsPerEpoch: number;
  genesisTime: number;
  networkName: string;
  hezeForkEpoch?: number;
  hezeSecondsPerSlot?: number;
}

export function useValue(props: ValueProps): State {
  const [secondsPerSlot, setSecondsPerSlot] = useState<number>(props.secondsPerSlot);
  const [slotsPerEpoch, setSlotsPerEpoch] = useState<number>(props.slotsPerEpoch);
  const [genesisTime, setGenesisTime] = useState<number>(props.genesisTime);
  const [networkName, setNetworkName] = useState<string>(props.networkName);
  const { hezeForkEpoch, hezeSecondsPerSlot } = props;

  const slotDuration = useCallback(
    (slot: number) =>
      scheduleSlotDuration(
        { genesisTime, secondsPerSlot, slotsPerEpoch, hezeForkEpoch, hezeSecondsPerSlot },
        slot,
      ),
    [genesisTime, secondsPerSlot, slotsPerEpoch, hezeForkEpoch, hezeSecondsPerSlot],
  );

  const slotStartTime = useCallback(
    (slot: number) =>
      scheduleSlotStartTime(
        { genesisTime, secondsPerSlot, slotsPerEpoch, hezeForkEpoch, hezeSecondsPerSlot },
        slot,
      ),
    [genesisTime, secondsPerSlot, slotsPerEpoch, hezeForkEpoch, hezeSecondsPerSlot],
  );

  const slotAtTime = useCallback(
    (time: number) =>
      scheduleSlotAtTime(
        { genesisTime, secondsPerSlot, slotsPerEpoch, hezeForkEpoch, hezeSecondsPerSlot },
        time,
      ),
    [genesisTime, secondsPerSlot, slotsPerEpoch, hezeForkEpoch, hezeSecondsPerSlot],
  );

  return {
    secondsPerSlot,
    setSecondsPerSlot,
    slotsPerEpoch,
    setSlotsPerEpoch,
    genesisTime,
    setGenesisTime,
    networkName,
    setNetworkName,
    slotDuration,
    slotStartTime,
    slotAtTime,
  };
}
