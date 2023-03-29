import { useState, useEffect } from 'react';

import { FrameMetaData } from '@app/types/api';

export type Data = {
  frames?: FrameMetaData[];
  lastFetched: number;
};

export interface State {
  padding: number;
  slots: Record<number, Data>;
  updateSlot: (slot: number, data?: FrameMetaData[]) => void;
}

export interface Props {
  padding: number;
}

function useFrameMeta(props: Props): State {
  const [padding, setPadding] = useState<number>(props.padding);
  const [slots, setSlots] = useState<Record<number, Data>>({});

  useEffect(() => {
    setPadding(props.padding);
  }, [props.padding]);

  const updateSlot = (slot: number, data?: FrameMetaData[]) => {
    setSlots((prevSlots) => ({
      ...prevSlots,
      [slot]: { frames: data, lastFetched: new Date().getTime() },
    }));
  };

  return {
    padding,
    slots,
    updateSlot,
  };
}

export default useFrameMeta;
