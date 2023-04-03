import { act, renderHook } from '@testing-library/react';
import { vi } from 'vitest';

import useWindowSize from '@hooks/useWindowSize';

describe('useWindowSize', () => {
  it('should return the initial window size', () => {
    const { result } = renderHook(() => useWindowSize());

    expect(result.current[0]).toEqual(window.innerWidth);
    expect(result.current[1]).toEqual(window.innerHeight);
  });

  it('should update the window size on resize event', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1000,
    });

    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    });

    const { result } = renderHook(() => useWindowSize());

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 900,
    });

    await act(async () => {
      global.dispatchEvent(new Event('resize'));
    });

    expect(result.current[0]).toEqual(1200);
    expect(result.current[1]).toEqual(900);
  });
});
