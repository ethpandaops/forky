import { useLocation } from '@tanstack/react-router';

import App from '@app/App';

/**
 * Derives the application view from the current pathname. Forky's URL scheme
 * composes paths (`/byo`, `/node/<id>`, `/snapshot/<id>`) with an optional
 * `/events` suffix, so a single component reads the pathname and renders the
 * App with the appropriate props.
 */
export default function RouteView() {
  const pathname = useLocation({ select: location => location.pathname });

  if (pathname.startsWith('/byo')) {
    return <App byo />;
  }

  if (pathname.startsWith('/snapshot/')) {
    const id = pathname.slice('/snapshot/'.length).split('/')[0];

    return <App frameId={id} />;
  }

  if (pathname.startsWith('/node/')) {
    const rest = pathname.slice('/node/'.length);
    const parts = rest.split('/');
    const hasEvents = parts[parts.length - 1] === 'events';
    const node = hasEvents ? parts.slice(0, -1).join('/') : rest;

    return <App node={node} />;
  }

  return <App />;
}
