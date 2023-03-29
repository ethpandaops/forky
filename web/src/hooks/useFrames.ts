import { useState, useEffect } from 'react';

import { ForkChoiceData } from '@app/types/api';
import { WeightedGraph, weightedGraphFromData } from '@app/utils/graph';

export type Data = {
  data: ForkChoiceData;
  graph: WeightedGraph;
  lastFetched: number;
};

export interface State {
  frames: Record<string, Data>;
  updateFrame: (id: string, data: ForkChoiceData) => void;
}

function useFrames(): State {
  const [frames, setFrames] = useState<Record<string, Data>>({});

  const updateFrame = (id: string, data: ForkChoiceData) => {
    setFrames((prevFrames) => ({
      ...prevFrames,
      [id]: { data, graph: weightedGraphFromData(data), lastFetched: new Date().getTime() },
    }));
  };

  return {
    frames,
    updateFrame,
  };
}

export default useFrames;
