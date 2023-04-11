import { useState, useCallback, useRef, useEffect, memo, ReactNode } from 'react';

import useFocus from '@contexts/focus';
import usePointer from '@hooks/usePointer';

const TimeDrag = ({ multiplier, children }: { multiplier: number; children?: ReactNode }) => {
  const { time: focusedTime, shiftTime: shiftFocusedTime, playing, stop: stopTimer } = useFocus();
  const [dragging, setDragging] = useState(false);
  const { up, x } = usePointer({ listen: true });
  const prevX = useRef<number | null>(null);
  const lastPositions = useRef<number[]>([]);
  const lastTimes = useRef<number[]>([]);
  const velocityRef = useRef(0);
  const requestIdRef = useRef<number | null>(null);
  const lastMoveTimeRef = useRef(performance.now());

  useEffect(() => {
    if (up) {
      setDragging(false);
      prevX.current = null;
    }
  }, [up]);

  const handlePointerUp = useCallback(() => {
    setDragging(false);
    prevX.current = null;
  }, []);

  useEffect(() => {
    if (playing) {
      velocityRef.current = 0;
      lastPositions.current = [];
      lastTimes.current = [];
    }
  }, [playing]);

  const updateFocusedTime = useCallback(() => {
    if (!playing) {
      const deltaTime = velocityRef.current;
      shiftFocusedTime(-deltaTime);
      velocityRef.current *= 0.9;
    }

    if (!playing && Math.abs(velocityRef.current) > 1) {
      requestIdRef.current = requestAnimationFrame(updateFocusedTime);
    } else {
      requestIdRef.current = null;
    }
  }, [shiftFocusedTime, playing]);

  useEffect(() => {
    if (prevX.current !== x && dragging && x !== null && prevX.current !== null) {
      const deltaX = x - prevX.current;
      shiftFocusedTime(-deltaX * multiplier);

      lastPositions.current.push(x);
      lastTimes.current.push(Date.now());

      if (lastPositions.current.length > 5) {
        lastPositions.current.shift();
        lastTimes.current.shift();
      }
      lastMoveTimeRef.current = performance.now();
    } else if (prevX.current !== x && !dragging && !playing && lastPositions.current.length > 0) {
      const lastDeltaX =
        lastPositions.current[lastPositions.current.length - 1] - lastPositions.current[0];
      const lastDeltaTime = lastTimes.current[lastTimes.current.length - 1] - lastTimes.current[0];
      const elapsedTimeSinceLastMove = performance.now() - lastMoveTimeRef.current;
      if (lastDeltaTime !== 0 && elapsedTimeSinceLastMove < 25) {
        const velocity = -(lastDeltaX / lastDeltaTime) * -1000;
        if (Math.abs(velocity) > 250) {
          velocityRef.current = velocity;
          requestIdRef.current = requestAnimationFrame(updateFocusedTime);
        }
      }

      lastPositions.current = [];
      lastTimes.current = [];
    }
    prevX.current = x;
  }, [dragging, x, focusedTime, updateFocusedTime, playing]);

  const handlePointerDown = useCallback(() => {
    if (playing) stopTimer();
    lastPositions.current = [];
    lastTimes.current = [];
    velocityRef.current = 0;
    if (requestIdRef.current !== null) {
      cancelAnimationFrame(requestIdRef.current);
      requestIdRef.current = null;
    }
    setDragging(true);
  }, [playing]);

  return (
    <div
      className="absolute top-0 left-0 w-full h-full"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {children}
    </div>
  );
};

export default memo(TimeDrag);
