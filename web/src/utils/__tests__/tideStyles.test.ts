import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// The Tide's motion lives in index.css; an animation naming keyframes that
// do not exist silently does nothing, so check every Tide animation has its
// keyframes.
describe('tide styles', () => {
  const css = readFileSync(resolve(__dirname, '../../index.css'), 'utf8');

  it('should define keyframes for every tide animation', () => {
    const used = [...css.matchAll(/animation:\s*(tide-[a-z-]+)/g)].map(m => m[1]);
    const defined = new Set([...css.matchAll(/@keyframes\s+(tide-[a-z-]+)/g)].map(m => m[1]));

    expect(used.length).toBeGreaterThan(0);
    for (const name of used) expect(defined).toContain(name);
  });
});
