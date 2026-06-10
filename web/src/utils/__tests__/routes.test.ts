import { describe, expect, it } from 'vitest';

import { eventsPathFor, parseAppRoute, parseNodeSplat } from '@utils/routes';

describe('routes', () => {
  it.each([
    ['/', 'home'],
    ['/events', 'events'],
    ['/byo', 'byo'],
    ['/byo/events', 'byoEvents'],
    ['/node/ams3-teku-001', 'node'],
    ['/node/ams3-teku-001/events', 'nodeEvents'],
    ['/node/ethpandaops/mainnet/node-001', 'node'],
    ['/node/ethpandaops/mainnet/node-001/events', 'nodeEvents'],
    ['/snapshot/frame-alpha', 'snapshot'],
    ['/snapshot/frame-alpha/events', 'snapshotEvents'],
  ])('parses %s as %s', (path, kind) => {
    expect(parseAppRoute(path)?.kind).toBe(kind);
  });

  it('parses multi-segment node ids with literal slashes', () => {
    const route = parseAppRoute('/node/ethpandaops/mainnet/node-001');
    expect(route).toMatchObject({
      kind: 'node',
      nodeId: 'ethpandaops/mainnet/node-001',
      path: '/node/ethpandaops/mainnet/node-001',
    });

    const events = parseAppRoute('/node/ethpandaops/mainnet/node-001/events');
    expect(events).toMatchObject({
      kind: 'nodeEvents',
      nodeId: 'ethpandaops/mainnet/node-001',
      closeTo: '/node/ethpandaops/mainnet/node-001',
    });
  });

  it('canonicalizes encoded slashes in node ids to literal slashes', () => {
    expect(parseAppRoute('/node/sentry%2Fone')).toMatchObject({
      kind: 'node',
      nodeId: 'sentry/one',
      path: '/node/sentry/one',
    });
  });

  it('encodes route params when normalizing paths', () => {
    expect(parseAppRoute('/snapshot/frame%20alpha/events')?.path).toBe(
      '/snapshot/frame%20alpha/events',
    );
  });

  it.each([
    [undefined, undefined],
    ['', undefined],
    ['ams3-teku-001', { nodeId: 'ams3-teku-001', events: false }],
    ['ams3-teku-001/events', { nodeId: 'ams3-teku-001', events: true }],
    ['ethpandaops/mainnet/node-001', { nodeId: 'ethpandaops/mainnet/node-001', events: false }],
    [
      'ethpandaops/mainnet/node-001/events',
      { nodeId: 'ethpandaops/mainnet/node-001', events: true },
    ],
    ['events', { nodeId: 'events', events: false }],
  ])('parses node splat %s', (splat, expected) => {
    expect(parseNodeSplat(splat)).toEqual(expected);
  });

  it.each([
    ['/', '/events'],
    ['/events', '/events'],
    ['/byo', '/byo/events'],
    ['/byo/events', '/byo/events'],
    ['/node/ams3-teku-001', '/node/ams3-teku-001/events'],
    ['/node/ams3-teku-001/events', '/node/ams3-teku-001/events'],
    ['/node/ethpandaops/mainnet/node-001', '/node/ethpandaops/mainnet/node-001/events'],
    ['/node/ethpandaops/mainnet/node-001/events', '/node/ethpandaops/mainnet/node-001/events'],
    ['/snapshot/frame-alpha', '/snapshot/frame-alpha/events'],
    ['/snapshot/frame-alpha/events', '/snapshot/frame-alpha/events'],
    ['/unknown', '/events'],
  ])('builds event route %s -> %s', (path, eventsPath) => {
    expect(eventsPathFor(path)).toBe(eventsPath);
  });
});
