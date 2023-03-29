import { useState } from 'react';

export interface State {
  secondsPerSlot: number;
  setSecondsPerSlot: (secondsPerSlot: number) => void;
  slotsPerEpoch: number;
  setSlotsPerEpoch: (slotsPerEpoch: number) => void;
  genesisTime: number;
  setGenesisTime: (genesisTime: number) => void;
  networkName: string;
  setNetworkName: (networkName: string) => void;
  node?: string;
  setNode: (node?: string) => void;
}

export interface Props {
  secondsPerSlot: number;
  slotsPerEpoch: number;
  genesisTime: number;
  networkName: string;
  node?: string;
}

function useNetwork(props: Props): State {
  const [secondsPerSlot, setSecondsPerSlot] = useState<number>(props.secondsPerSlot);
  const [slotsPerEpoch, setSlotsPerEpoch] = useState<number>(props.slotsPerEpoch);
  const [genesisTime, setGenesisTime] = useState<number>(props.genesisTime);
  const [networkName, setNetworkName] = useState<string>(props.networkName);
  const [node, setNode] = useState<string | undefined>(props.node);

  return {
    secondsPerSlot,
    setSecondsPerSlot,
    slotsPerEpoch,
    setSlotsPerEpoch,
    genesisTime,
    setGenesisTime,
    networkName,
    setNetworkName,
    node,
    setNode,
  };
}

export default useNetwork;
