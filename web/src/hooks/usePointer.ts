import { useEffect, useState } from 'react';

interface PointerState {
  x: number | null;
  up: boolean;
}

interface PointerProps {
  listen: boolean;
}

const defaultPointerState: PointerState = {
  x: null,
  up: false,
};

export default function usePointer({ listen }: PointerProps): PointerState {
  const [pointerState, setPointerState] = useState<PointerState>(defaultPointerState);

  function handlePointerEvent(event: MouseEvent | TouchEvent) {
    if (event instanceof MouseEvent) {
      if (pointerState.x === event.clientX && pointerState.up === (event.type === 'mouseup')) {
        return;
      }
      setPointerState({
        x: event.clientX,
        up: event.type === 'mouseup',
      });
    } else if (event instanceof TouchEvent) {
      const touch = event.touches[0] as Touch | undefined;
      if (pointerState.x === touch?.clientX && pointerState.up === (event.type === 'touchend')) {
        return;
      }
      setPointerState({
        x: touch?.clientX ?? pointerState.x,
        up: event.type === 'touchend',
      });
    }
  }

  useEffect(() => {
    if (listen) {
      document.addEventListener('mousemove', handlePointerEvent);
      document.addEventListener('mouseup', handlePointerEvent);
      document.addEventListener('touchmove', handlePointerEvent, {
        passive: false,
      });
      document.addEventListener('touchend', handlePointerEvent, {
        passive: false,
      });
    }

    return () => {
      document.removeEventListener('mousemove', handlePointerEvent);
      document.removeEventListener('mouseup', handlePointerEvent);
      document.removeEventListener('touchmove', handlePointerEvent);
      document.removeEventListener('touchend', handlePointerEvent);
    };
  }, [listen]);

  return pointerState;
}
