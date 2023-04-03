import {
  useContext as reactUseContext,
  createContext,
  useRef,
  useState,
  useCallback,
  useEffect,
} from 'react';

import useEthereum from '@contexts/ethereum';
import useFocus from '@contexts/focus';

export const Context = createContext<State | undefined>(undefined);

export default function useContext() {
  const context = reactUseContext(Context);
  if (context === undefined) {
    throw new Error('Ethereum context must be used within a Ethereum provider');
  }
  return context;
}

export type State = {
  setTime: (time: number, shouldPlay?: boolean) => void;
  shiftTime: (delta: number, shouldPlay?: boolean) => void;
  setSlot: (slot: number, shouldPlay?: boolean) => void;
  setEpoch: (epoch: number, shouldPlay?: boolean) => void;
  play: (offset?: number) => void;
  stop: () => void;
  playing: boolean;
};

export interface ValueProps {
  playing: boolean;
}

export function useValue(props: ValueProps): State {
  const { shiftTime, time } = useFocus();
  const { genesisTime, slotsPerEpoch, secondsPerSlot } = useEthereum();
  const timer = useRef<number | null>(null);
  const startTime = useRef<number | null>(null);
  const [playing, setPlaying] = useState(props.playing);

  const play = useCallback(
    (offset?: number) => {
      if (timer.current) window.clearInterval(timer.current);
      startTime.current = new Date().getTime() - (offset ?? 0);
      timer.current = window.setInterval(() => {
        const elapsedTime = new Date().getTime() - (startTime.current ?? 0);
        shiftTime(elapsedTime);
      }, 20);
      setPlaying(true);
    },
    [playing, timer.current],
  );

  const stop = useCallback(() => {
    if (timer.current) {
      window.clearInterval(timer.current);
      timer.current = null;
    }
    setPlaying(false);
  }, [timer, timer.current]);

  const setTimeWrapped = useCallback(
    (targetTime: number, shouldPlay?: boolean) => {
      if (shouldPlay === true || (shouldPlay === undefined && playing)) {
        play(targetTime - time);
      } else {
        shiftTime(targetTime - time);
      }
    },
    [playing, time, play, shiftTime],
  );

  const shiftTimeWrapped = useCallback(
    (offset: number, shouldPlay?: boolean) => {
      if (shouldPlay === true || (shouldPlay === undefined && playing)) {
        play(offset);
      } else {
        shiftTime(offset);
      }
    },
    [playing, play, shiftTime],
  );

  const setSlotWrapped = useCallback(
    (slot: number, shouldPlay?: boolean) => {
      if (slot < 0) return;
      const offset = genesisTime + slot * secondsPerSlot * 1000 - time;
      if (shouldPlay === true || (shouldPlay === undefined && playing)) {
        play(offset);
      } else {
        shiftTime(offset);
      }
    },
    [genesisTime, secondsPerSlot, play, shiftTime],
  );

  const setEpochWrapped = useCallback(
    (epoch: number, shouldPlay?: boolean) => {
      if (epoch < 0) return;
      const offset = genesisTime + epoch * slotsPerEpoch * secondsPerSlot * 1000 - time;
      if (shouldPlay === true || (shouldPlay === undefined && playing)) {
        play(offset);
      } else {
        shiftTime(offset);
      }
    },
    [genesisTime, secondsPerSlot, slotsPerEpoch, play, shiftTime],
  );

  useEffect(() => {
    if (playing) play();
    return () => {
      stop();
    };
  }, [playing, play, stop]);

  return {
    setTime: setTimeWrapped,
    shiftTime: shiftTimeWrapped,
    setSlot: setSlotWrapped,
    setEpoch: setEpochWrapped,
    play,
    stop,
    playing,
  };
}
