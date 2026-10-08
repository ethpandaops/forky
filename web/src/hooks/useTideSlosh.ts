import { useEffect, useRef, useState } from 'react';

import { subscribeSlosh } from '@utils/slosh';

// Spring constants, per 60 Hz frame: a natural period of about a second and
// light damping, so the liquid rocks a few times before settling.
const STIFFNESS = 0.012;
const DAMPING = 0.055;
// Tilt kick (degrees per frame) per px/ms change in the canvas velocity.
const KICK = 1.4;
const MAX_TILT = 14;
const MAX_SPIN = 3.5;
const REST = 0.03;

// A slosh peaking past this tilt crashes: spray leaps off the high side's
// crest and falls back towards the middle. At most this often, this many.
const SPLASH_TILT = 5;
const SPLASH_INTERVAL_MS = 320;
const MAX_SPRAY = 24;
// Above this level the surface is out of view, so there is nothing to crash.
const SPLASH_MAX_LEVEL = 92;

export interface TideSpray {
  id: number;
  // start position, percent of the node: on the crest at the high side.
  x: number;
  y: number;
  // flight, percent of the node: sideways travel, peak lift (negative is
  // up) and where it lands relative to its start.
  dx: number;
  rise: number;
  fall: number;
  size: number;
  duration: number;
  delay: number;
}

const clamp = (value: number, limit: number) => Math.min(Math.max(value, -limit), limit);
const between = (min: number, max: number) => min + Math.random() * (max - min);

let nextSprayId = 0;

// Spray for a slosh peaking at `tilt` degrees over liquid at `level`. A
// clockwise (positive) tilt raises the left side, so the wave crashes from
// the left towards the middle, and vice versa.
function crash(tilt: number, level: number): TideSpray[] {
  const fromLeft = tilt > 0;
  const slope = Math.tan((tilt * Math.PI) / 180);
  const count = Math.min(4 + Math.round(Math.abs(tilt) / 3), 9);

  return Array.from({ length: count }, () => {
    const x = fromLeft ? between(14, 32) : between(68, 86);
    return {
      id: nextSprayId++,
      x,
      // the tilted surface: rotating the liquid about the node's center
      // moves the surface by (x - 50) * tan(tilt).
      y: 100 - level + (x - 50) * slope,
      dx: (fromLeft ? 1 : -1) * between(6, 16),
      rise: -between(4, 11),
      fall: between(5, 11),
      size: between(1.2, 2.6),
      duration: between(0.65, 1.05),
      delay: between(0, 0.12),
    };
  });
}

/* Sloshes a Tide when the graph canvas is panned: the canvas's acceleration
 * kicks a damped spring whose angle tilts the liquid (it lags behind the
 * motion, piling up on the trailing side) and rocks back to level. When a
 * slosh peaks hard the wave crashes: spray leaps off the crest on the high
 * side and falls back into the liquid, and the crest flashes like foam.
 * Runs an animation frame loop only while the liquid moves, and not at all
 * for reduced motion. */
export default function useTideSlosh(enabled: boolean, level: number) {
  const liquidRef = useRef<HTMLDivElement>(null);
  const crestRef = useRef<HTMLDivElement>(null);
  const levelRef = useRef(level);
  const [spray, setSpray] = useState<TideSpray[]>([]);

  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    let tilt = 0;
    let spin = 0;
    let lastVelocity = 0;
    let lastFrame = 0;
    let lastSplash = 0;
    let frame = 0;

    const render = () => {
      const el = liquidRef.current;
      if (el) el.style.transform = tilt === 0 ? '' : `rotate(${tilt.toFixed(2)}deg)`;
    };

    const splash = (now: number) => {
      const liquidLevel = levelRef.current;
      if (Math.abs(tilt) < SPLASH_TILT || liquidLevel > SPLASH_MAX_LEVEL) return;
      if (now - lastSplash < SPLASH_INTERVAL_MS) return;
      lastSplash = now;
      const spawned = crash(tilt, liquidLevel);
      setSpray(current => [...current, ...spawned].slice(-MAX_SPRAY));
      crestRef.current?.animate?.([{ filter: 'brightness(1.7)' }, { filter: 'brightness(1)' }], {
        duration: 520,
        easing: 'ease-out',
      });
    };

    const step = (now: number) => {
      const dt = Math.min((now - lastFrame) / (1000 / 60), 3);
      lastFrame = now;
      const previousSpin = spin;
      spin = clamp(spin + (-STIFFNESS * tilt - DAMPING * spin) * dt, MAX_SPIN);
      tilt = clamp(tilt + spin * dt, MAX_TILT);
      // the slosh peaks where it stops rising and turns back
      if (Math.sign(spin) !== Math.sign(previousSpin)) splash(now);
      if (Math.abs(tilt) < REST && Math.abs(spin) < REST) {
        tilt = 0;
        spin = 0;
        frame = 0;
        render();
        return;
      }
      render();
      frame = requestAnimationFrame(step);
    };

    const unsubscribe = subscribeSlosh(velocity => {
      // Accelerating the canvas one way piles the liquid up on the trailing
      // side: a clockwise tilt raises the left when moving right.
      spin = clamp(spin + (velocity - lastVelocity) * KICK, MAX_SPIN);
      lastVelocity = velocity;
      if (!frame) {
        lastFrame = performance.now();
        frame = requestAnimationFrame(step);
      }
    });

    return () => {
      unsubscribe();
      if (frame) cancelAnimationFrame(frame);
      tilt = 0;
      render();
    };
  }, [enabled]);

  const settleSpray = (id: number) => setSpray(current => current.filter(s => s.id !== id));

  return { liquidRef, crestRef, spray, settleSpray };
}
