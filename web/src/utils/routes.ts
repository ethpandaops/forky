export type AppRoute =
  | { kind: 'home'; path: '/' }
  | { kind: 'events'; path: '/events'; closeTo: '/' }
  | { kind: 'byo'; path: '/byo' }
  | { kind: 'byoEvents'; path: '/byo/events'; closeTo: '/byo' }
  | { kind: 'node'; path: string; nodeId: string }
  | { kind: 'nodeEvents'; path: string; nodeId: string; closeTo: string }
  | { kind: 'snapshot'; path: string; frameId: string }
  | { kind: 'snapshotEvents'; path: string; frameId: string; closeTo: string };

function normalizePath(path: string): string {
  const pathname = path.split(/[?#]/, 1)[0] || '/';
  const withLeadingSlash = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return withLeadingSlash.length > 1 ? withLeadingSlash.replace(/\/+$/, '') : withLeadingSlash;
}

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export function nodePath(nodeId: string): string {
  return `/node/${encodeURIComponent(nodeId)}`;
}

export function nodeEventsPath(nodeId: string): string {
  return `${nodePath(nodeId)}/events`;
}

export function snapshotPath(frameId: string): string {
  return `/snapshot/${encodeURIComponent(frameId)}`;
}

export function snapshotEventsPath(frameId: string): string {
  return `${snapshotPath(frameId)}/events`;
}

export function parseAppRoute(path: string): AppRoute | undefined {
  const normalizedPath = normalizePath(path);
  const segments = normalizedPath.split('/').filter(Boolean);

  if (segments.length === 0) return { kind: 'home', path: '/' };
  if (segments.length === 1 && segments[0] === 'events') {
    return { kind: 'events', path: '/events', closeTo: '/' };
  }
  if (segments.length === 1 && segments[0] === 'byo') return { kind: 'byo', path: '/byo' };
  if (segments.length === 2 && segments[0] === 'byo' && segments[1] === 'events') {
    return { kind: 'byoEvents', path: '/byo/events', closeTo: '/byo' };
  }
  if (segments.length === 2 && segments[0] === 'node') {
    const nodeId = decodeSegment(segments[1]);
    return { kind: 'node', path: nodePath(nodeId), nodeId };
  }
  if (segments.length === 3 && segments[0] === 'node' && segments[2] === 'events') {
    const nodeId = decodeSegment(segments[1]);
    return { kind: 'nodeEvents', path: nodeEventsPath(nodeId), nodeId, closeTo: nodePath(nodeId) };
  }
  if (segments.length === 2 && segments[0] === 'snapshot') {
    const frameId = decodeSegment(segments[1]);
    return { kind: 'snapshot', path: snapshotPath(frameId), frameId };
  }
  if (segments.length === 3 && segments[0] === 'snapshot' && segments[2] === 'events') {
    const frameId = decodeSegment(segments[1]);
    return {
      kind: 'snapshotEvents',
      path: snapshotEventsPath(frameId),
      frameId,
      closeTo: snapshotPath(frameId),
    };
  }

  return undefined;
}

export function eventsPathFor(path: string): string {
  const route = parseAppRoute(path);

  switch (route?.kind) {
    case 'home':
      return '/events';
    case 'byo':
      return '/byo/events';
    case 'node':
      return nodeEventsPath(route.nodeId);
    case 'snapshot':
      return snapshotEventsPath(route.frameId);
    case 'events':
    case 'byoEvents':
    case 'nodeEvents':
    case 'snapshotEvents':
      return route.path;
    default:
      return '/events';
  }
}
