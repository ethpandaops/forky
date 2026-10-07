// Carries the graph canvas's pan velocity to the Tide in the lead nodes, so
// their liquid can slosh as the canvas is dragged. A plain pub/sub rather
// than React state: pans fire every frame and only the subscribed tides'
// animation loops need to hear about them.

export type SloshListener = (velocityX: number) => void;

const listeners = new Set<SloshListener>();
let last: { x: number; t: number } | undefined;

// Pan samples further apart than this start a new gesture rather than
// producing a velocity.
const MAX_SAMPLE_GAP_MS = 120;

export function subscribeSlosh(listener: SloshListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Reports the canvas position during a pan; publishes its horizontal
// velocity in screen pixels per millisecond.
export function reportCanvasPan(positionX: number, now = performance.now()): void {
  if (last && now > last.t && now - last.t < MAX_SAMPLE_GAP_MS) {
    const velocityX = (positionX - last.x) / (now - last.t);
    listeners.forEach(listener => listener(velocityX));
  }
  last = { x: positionX, t: now };
}

// Ends a pan gesture, so the next one does not measure across the gap.
export function endCanvasPan(): void {
  if (last) listeners.forEach(listener => listener(0));
  last = undefined;
}
