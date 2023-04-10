import { useContext as reactUseContext, createContext, useState } from 'react';

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
}

export interface ValueProps {
  secondsPerSlot: number;
  slotsPerEpoch: number;
  genesisTime: number;
  networkName: string;
}

export function useValue(props: ValueProps): State {
  const [secondsPerSlot, setSecondsPerSlot] = useState<number>(props.secondsPerSlot);
  const [slotsPerEpoch, setSlotsPerEpoch] = useState<number>(props.slotsPerEpoch);
  const [genesisTime, setGenesisTime] = useState<number>(props.genesisTime);
  const [networkName, setNetworkName] = useState<string>(props.networkName);

  return {
    secondsPerSlot,
    setSecondsPerSlot,
    slotsPerEpoch,
    setSlotsPerEpoch,
    genesisTime,
    setGenesisTime,
    networkName,
    setNetworkName,
  };
}
