import { endCanvasPan, reportCanvasPan, subscribeSlosh } from '@utils/slosh';

describe('slosh', () => {
  afterEach(() => endCanvasPan());

  it('should publish the horizontal pan velocity in px/ms', () => {
    const velocities: number[] = [];
    const unsubscribe = subscribeSlosh(v => velocities.push(v));

    reportCanvasPan(100, 1000);
    reportCanvasPan(130, 1010);
    reportCanvasPan(120, 1030);
    unsubscribe();

    expect(velocities).toEqual([3, -0.5]);
  });

  it('should not measure across a gap between pans', () => {
    const velocities: number[] = [];
    const unsubscribe = subscribeSlosh(v => velocities.push(v));

    reportCanvasPan(0, 1000);
    reportCanvasPan(500, 2000);
    unsubscribe();

    expect(velocities).toEqual([]);
  });

  it('should settle listeners and start a new gesture when a pan ends', () => {
    const velocities: number[] = [];
    const unsubscribe = subscribeSlosh(v => velocities.push(v));

    reportCanvasPan(0, 1000);
    reportCanvasPan(20, 1010);
    endCanvasPan();
    reportCanvasPan(900, 1020);
    unsubscribe();

    expect(velocities).toEqual([2, 0]);
  });

  it('should stop publishing to unsubscribed listeners', () => {
    const velocities: number[] = [];
    const unsubscribe = subscribeSlosh(v => velocities.push(v));
    unsubscribe();

    reportCanvasPan(0, 1000);
    reportCanvasPan(10, 1010);

    expect(velocities).toEqual([]);
  });
});
