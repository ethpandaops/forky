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
  slotDurationMs: number;
  setSlotDurationMs: (slotDurationMs: number) => void;
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
  slotDurationMs: number;
  slotsPerEpoch: number;
  genesisTime: number;
  networkName: string;
  hezeForkEpoch?: number;
  hezeSlotDurationMs?: number;
}

export function useValue(props: ValueProps): State {
  const [slotDurationMs, setSlotDurationMs] = useState<number>(props.slotDurationMs);
  const [slotsPerEpoch, setSlotsPerEpoch] = useState<number>(props.slotsPerEpoch);
  const [genesisTime, setGenesisTime] = useState<number>(props.genesisTime);
  const [networkName, setNetworkName] = useState<string>(props.networkName);
  const { hezeForkEpoch, hezeSlotDurationMs } = props;

  const slotDuration = useCallback(
    (slot: number) =>
      scheduleSlotDuration(
        { genesisTime, slotDurationMs, slotsPerEpoch, hezeForkEpoch, hezeSlotDurationMs },
        slot,
      ),
    [genesisTime, slotDurationMs, slotsPerEpoch, hezeForkEpoch, hezeSlotDurationMs],
  );

  const slotStartTime = useCallback(
    (slot: number) =>
      scheduleSlotStartTime(
        { genesisTime, slotDurationMs, slotsPerEpoch, hezeForkEpoch, hezeSlotDurationMs },
        slot,
      ),
    [genesisTime, slotDurationMs, slotsPerEpoch, hezeForkEpoch, hezeSlotDurationMs],
  );

  const slotAtTime = useCallback(
    (time: number) =>
      scheduleSlotAtTime(
        { genesisTime, slotDurationMs, slotsPerEpoch, hezeForkEpoch, hezeSlotDurationMs },
        time,
      ),
    [genesisTime, slotDurationMs, slotsPerEpoch, hezeForkEpoch, hezeSlotDurationMs],
  );

  return {
    slotDurationMs,
    setSlotDurationMs,
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
