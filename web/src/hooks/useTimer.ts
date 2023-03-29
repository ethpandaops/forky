import { useState, useRef, useCallback, useEffect } from 'react';

type State = {
  playTimer: (genesisTime: number, setFocusedTime: (time: number) => void, offset: number) => void;
  stopTimer: () => void;
  playing: boolean;
};

export default function useTimer(): State {
  const timer = useRef<number | null>(null);
  const startTime = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);

  const playTimer = useCallback(
    (genesisTime: number, setFocusedTime: (time: number) => void, offset: number) => {
      if (timer.current) window.clearInterval(timer.current);
      startTime.current = new Date().getTime() - offset;
      timer.current = window.setInterval(() => {
        const elapsedTime = new Date().getTime() - (startTime.current ?? 0);
        setFocusedTime(genesisTime + elapsedTime);
      }, 20);
      setPlaying(true);
    },
    [playing, timer.current],
  );

  const stopTimer = useCallback(() => {
    if (timer.current) {
      window.clearInterval(timer.current);
      timer.current = null;
    }
    setPlaying(false);
  }, [timer, timer.current]);

  useEffect(() => stopTimer, []);

  return { playTimer, stopTimer, playing };
}
