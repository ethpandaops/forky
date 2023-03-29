import { useState, useEffect, useCallback } from 'react';

import useTimer from '@hooks/useTimer';

export type State = {
  focusedTime: number;
  setFocusedTime: (time: number, play?: boolean) => void;
  shiftFocusedTime: (delta: number, play?: boolean) => void;
  focusedSlot: number;
  focusedEpoch: number;
  focusedTimeIntoSlot: number;
  focusedTimeIntoEpoch: number;
  genesisTime: number;
  secondsPerSlot: number;
  slotsPerEpoch: number;
  setCurrentSlot: (slot: number, play?: boolean) => void;
  setCurrentEpoch: (epoch: number, play?: boolean) => void;
  playTimer: () => void;
  stopTimer: () => void;
  playing: boolean;
};

export type Props = {
  genesisTime: number;
  secondsPerSlot: number;
  slotsPerEpoch: number;
  initialFocusedTime: number;
};

export default function useTimeline(props: Props): State {
  const [genesisTime, setGenesisTime] = useState(props.genesisTime);
  const [focusedTime, setFocusedTime] = useState(props.initialFocusedTime);
  const timer = useTimer();

  useEffect(() => {
    setGenesisTime(props.genesisTime);
  }, [props.genesisTime]);

  const playingSetFocusedTime = useCallback(
    (time: number, play?: boolean) => {
      if (play === true || (play === undefined && timer.playing)) {
        timer.playTimer(genesisTime, setFocusedTime, time - genesisTime);
      } else {
        setFocusedTime(time < genesisTime ? genesisTime : time);
      }
    },
    [timer.playing, timer.stopTimer, timer.playTimer, genesisTime, setFocusedTime],
  );

  const setCurrentSlot = useCallback(
    (slot: number, play?: boolean) => {
      if (slot < 0) return;
      playingSetFocusedTime(genesisTime + slot * props.secondsPerSlot * 1000, play);
    },
    [playingSetFocusedTime, genesisTime, props.secondsPerSlot],
  );

  const setCurrentEpoch = useCallback(
    (slot: number, play?: boolean) => {
      if (slot < 0) return;
      playingSetFocusedTime(
        genesisTime + slot * props.slotsPerEpoch * props.secondsPerSlot * 1000,
        play,
      );
    },
    [playingSetFocusedTime, genesisTime, props.secondsPerSlot, props.slotsPerEpoch],
  );

  const playTimer = useCallback(() => {
    timer.playTimer(genesisTime, setFocusedTime, focusedTime - genesisTime);
  }, [timer.playTimer, genesisTime, setFocusedTime, focusedTime]);

  const timeDiff = (focusedTime - genesisTime) / 1000;
  const focusedSlot = Math.floor(timeDiff / props.secondsPerSlot);
  const focusedEpoch = Math.floor(focusedSlot / props.slotsPerEpoch);
  const focusedTimeIntoSlot = Math.ceil((timeDiff % props.secondsPerSlot) * 1000);
  const focusedTimeIntoEpoch =
    (focusedSlot % props.slotsPerEpoch) * props.secondsPerSlot * 1000 + focusedTimeIntoSlot;

  const shiftFocusedTime = useCallback(
    (delta: number, play?: boolean) => {
      timer.stopTimer();
      const newFocusedTime = focusedTime + delta;
      playingSetFocusedTime(newFocusedTime < genesisTime ? genesisTime : newFocusedTime, play);
    },
    [timer.stopTimer, focusedTime, genesisTime],
  );

  useEffect(() => playingSetFocusedTime(focusedTime, true), []);

  return {
    focusedTime,
    setFocusedTime: playingSetFocusedTime,
    shiftFocusedTime,
    focusedSlot,
    focusedEpoch,
    focusedTimeIntoSlot,
    focusedTimeIntoEpoch,
    genesisTime,
    secondsPerSlot: props.secondsPerSlot,
    slotsPerEpoch: props.slotsPerEpoch,
    playTimer,
    setCurrentSlot,
    setCurrentEpoch,
    stopTimer: timer.stopTimer,
    playing: timer.playing,
  };
}
