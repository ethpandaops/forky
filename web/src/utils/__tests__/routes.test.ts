import { describe, expect, it } from 'vitest';

import { eventsPathFor, parseAppRoute } from '@utils/routes';

describe('routes', () => {
  it.each([
    ['/', 'home'],
    ['/events', 'events'],
    ['/byo', 'byo'],
    ['/byo/events', 'byoEvents'],
    ['/node/ams3-teku-001', 'node'],
    ['/node/ams3-teku-001/events', 'nodeEvents'],
    ['/snapshot/frame-alpha', 'snapshot'],
    ['/snapshot/frame-alpha/events', 'snapshotEvents'],
  ])('parses %s as %s', (path, kind) => {
    expect(parseAppRoute(path)?.kind).toBe(kind);
  });

  it('encodes route params when normalizing paths', () => {
    expect(parseAppRoute('/node/sentry%2Fone')?.path).toBe('/node/sentry%2Fone');
    expect(parseAppRoute('/snapshot/frame%20alpha/events')?.path).toBe(
      '/snapshot/frame%20alpha/events',
    );
  });

  it.each([
    ['/', '/events'],
    ['/events', '/events'],
    ['/byo', '/byo/events'],
    ['/byo/events', '/byo/events'],
    ['/node/ams3-teku-001', '/node/ams3-teku-001/events'],
    ['/node/ams3-teku-001/events', '/node/ams3-teku-001/events'],
    ['/snapshot/frame-alpha', '/snapshot/frame-alpha/events'],
    ['/snapshot/frame-alpha/events', '/snapshot/frame-alpha/events'],
    ['/unknown', '/events'],
  ])('builds event route %s -> %s', (path, eventsPath) => {
    expect(eventsPathFor(path)).toBe(eventsPath);
  });
});
