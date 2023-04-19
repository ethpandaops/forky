import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';

import useOutsideInteraction from '@hooks/useOutsideInteraction';

describe('useOutsideInteraction', () => {
  it('should call the provided callback on outside mouse and touch events', () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => {
      const ref = { current: document.createElement('div') };
      useOutsideInteraction(ref, callback);
      return ref;
    });

    act(() => {
      const mouseDownEvent = new MouseEvent('mousedown');
      document.dispatchEvent(mouseDownEvent);
    });

    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      const touchStartEvent = new TouchEvent('touchstart');
      document.dispatchEvent(touchStartEvent);
    });

    expect(callback).toHaveBeenCalledTimes(2);

    unmount();
  });

  it('should not call the provided callback on inside mouse and touch events', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => {
      const ref = { current: document.createElement('div') };
      useOutsideInteraction(ref, callback);
      return ref;
    });

    act(() => {
      const mouseDownEvent = new MouseEvent('mousedown');
      result.current.current.dispatchEvent(mouseDownEvent);
    });

    expect(callback).toHaveBeenCalledTimes(0);

    act(() => {
      const touchStartEvent = new TouchEvent('touchstart');
      result.current.current.dispatchEvent(touchStartEvent);
    });

    expect(callback).toHaveBeenCalledTimes(0);
  });
});
