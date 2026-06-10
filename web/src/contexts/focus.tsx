import {
  useContext as reactUseContext,
  createContext,
  useCallback,
  useState,
  useEffect,
  useRef,
} from 'react';

import { ProcessedData } from '@app/types/graph';
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
  node?: string;
  frameId?: string;
  setTime: (time: number) => void;
  shiftTime: (delta: number) => void;
  setSlot: (slot: number) => void;
  setEpoch: (epoch: number) => void;
  slot: number;
  epoch: number;
  timeIntoSlot: number;
  timeIntoEpoch: number;
  play: (offset?: number) => void;
  stop: () => void;
  playing: boolean;
  byo: boolean;
  byoData?: ProcessedData;
  setBYOData: (data?: ProcessedData) => void;
}

export interface ValueProps {
  initialTime: number;
  node?: string;
  frameId?: string;
  playing: boolean;
  byo: boolean;
}

export function useValue(props: ValueProps): State {
  const [time, setTime] = useState(props.initialTime);
  const [node, setNode] = useState(props.node);
  const [frameId, setFrameId] = useState(props.frameId);
  const [byo, setBYO] = useState(props.byo);
  const [byoData, setBYODataInternal] = useState<ProcessedData | undefined>();
  const { secondsPerSlot, slotsPerEpoch, genesisTime } = useEthereum();
  const timer = useRef<number | null>(null);
  const initialPlayTime = useRef<number | undefined>(undefined);
  const [playing, setPlaying] = useState(props.playing);

  // Sync route-driven props into state during render (React's documented
  // pattern for adjusting state when props change).
  const [prevRouteProps, setPrevRouteProps] = useState({
    node: props.node,
    byo: props.byo,
    frameId: props.frameId,
  });
  if (
    prevRouteProps.node !== props.node ||
    prevRouteProps.byo !== props.byo ||
    prevRouteProps.frameId !== props.frameId
  ) {
    setPrevRouteProps({ node: props.node, byo: props.byo, frameId: props.frameId });
    if (props.node !== node) setNode(props.node);
    if (props.byo !== byo) setBYO(props.byo);
    if (props.frameId !== frameId) setFrameId(props.frameId);
  }

  const setTimeWrapper = useCallback(
    (update: number) => {
      setTime(update < genesisTime ? genesisTime : update);
    },
    [genesisTime, setTime],
  );

  const timeDiff = (time - genesisTime) / 1000;
  const slot = Math.floor(timeDiff / secondsPerSlot);
  const epoch = Math.floor(slot / slotsPerEpoch);
  const timeIntoSlot = Math.ceil((timeDiff % secondsPerSlot) * 1000);
  const timeIntoEpoch = (slot % slotsPerEpoch) * secondsPerSlot * 1000 + timeIntoSlot;

  const shiftTime = useCallback(
    (delta: number) => {
      setTime(prevTime => {
        const newTime = prevTime + delta;
        if (newTime < genesisTime) return prevTime;
        return newTime;
      });
    },
    [setTime, genesisTime],
  );

  const stepRef = useRef<() => void>(() => {});

  const step = useCallback(() => {
    if (!initialPlayTime.current) initialPlayTime.current = new Date().getTime();
    const currentTime = new Date().getTime();
    const timeDiff = currentTime - (initialPlayTime.current ?? 0);
    shiftTime(timeDiff);
    initialPlayTime.current = currentTime;
    timer.current = requestAnimationFrame(() => stepRef.current());
  }, [shiftTime]);

  useEffect(() => {
    stepRef.current = step;
  });

  const play = useCallback(
    (offset?: number) => {
      if (offset) shiftTime(offset);
      setPlaying(true);
    },
    [shiftTime],
  );

  const stop = useCallback(() => {
    setPlaying(false);
  }, []);

  const setSlot = useCallback(
    (targetSlot: number) => {
      if (targetSlot < 0) return;
      if (playing && timer.current) cancelAnimationFrame(timer.current);
      initialPlayTime.current = undefined;
      setTime(genesisTime + targetSlot * secondsPerSlot * 1000);
      if (playing) timer.current = requestAnimationFrame(step);
    },
    [setTime, genesisTime, secondsPerSlot, step, playing],
  );

  const setEpoch = useCallback(
    (targetEpoch: number) => {
      if (targetEpoch < 0) return;
      if (playing && timer.current) cancelAnimationFrame(timer.current);
      initialPlayTime.current = undefined;
      setTime(genesisTime + targetEpoch * slotsPerEpoch * secondsPerSlot * 1000);
      if (playing) timer.current = requestAnimationFrame(step);
    },
    [setTime, genesisTime, secondsPerSlot, slotsPerEpoch, step, playing],
  );

  const setBYOData = useCallback(
    (data?: ProcessedData) => {
      setBYODataInternal(data);
    },
    [setBYODataInternal],
  );

  // The animation-frame loop is an external system: subscribe to it while
  // playing and tear it down on stop/unmount.
  useEffect(() => {
    if (!playing) return;

    if (timer.current) cancelAnimationFrame(timer.current);
    initialPlayTime.current = new Date().getTime();
    timer.current = requestAnimationFrame(() => stepRef.current());

    return () => {
      initialPlayTime.current = undefined;
      if (timer.current) {
        cancelAnimationFrame(timer.current);
        timer.current = null;
      }
    };
  }, [playing]);

  useEffect(() => {
    return () => {
      if (timer.current) {
        cancelAnimationFrame(timer.current);
      }
    };
  }, []);

  return {
    time,
    node,
    frameId,
    setTime: setTimeWrapper,
    shiftTime,
    setSlot,
    setEpoch,
    slot,
    epoch,
    timeIntoSlot,
    timeIntoEpoch,
    play,
    stop,
    playing,
    byo,
    byoData,
    setBYOData,
  };
}
