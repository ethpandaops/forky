import { renderHook, act } from '@testing-library/react';

import usePointer, { PointerProps } from '@hooks/usePointer';

describe('usePointer', () => {
  const pointerProps: PointerProps = {
    listen: true,
  };

  it('should update pointerState on mouse events', () => {
    const { result } = renderHook(() => usePointer(pointerProps));

    act(() => {
      const mouseMoveEvent = new MouseEvent('mousemove', { clientX: 100 });
      document.dispatchEvent(mouseMoveEvent);
    });

    expect(result.current).toEqual({
      x: 100,
      up: false,
    });

    act(() => {
      const mouseUpEvent = new MouseEvent('mouseup', { clientX: 100 });
      document.dispatchEvent(mouseUpEvent);
    });

    expect(result.current).toEqual({
      x: 100,
      up: true,
    });
  });

  it('should not update pointerState when listen is false', () => {
    const { result } = renderHook(() => usePointer({ listen: false }));

    act(() => {
      const mouseMoveEvent = new MouseEvent('mousemove', { clientX: 100 });
      document.dispatchEvent(mouseMoveEvent);
    });

    expect(result.current).toEqual({
      x: null,
      up: false,
    });
  });
});
