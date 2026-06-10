import '@testing-library/jest-dom';
import { beforeAll, vi } from 'vitest';

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    value: 800,
  });

  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    value: 600,
  });

  const ResizeObserverMock = vi.fn(function (this: ResizeObserver) {
    this.observe = vi.fn();
    this.unobserve = vi.fn();
    this.disconnect = vi.fn();
  });

  vi.stubGlobal('ResizeObserver', ResizeObserverMock);
});
