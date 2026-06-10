import { MouseEventHandler, ReactNode } from 'react';

import { Link as RouterLink } from '@tanstack/react-router';

import { parseAppRoute } from '@utils/routes';

interface Props {
  href: string;
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  title?: string;
  children?: ReactNode;
}

/** The app's link primitive: links take plain paths and route to typed targets. */
export default function Link({ href, ...props }: Props) {
  const route = parseAppRoute(href);

  switch (route?.kind) {
    case 'home':
      return <RouterLink to="/" {...props} />;
    case 'events':
      return <RouterLink to="/events" {...props} />;
    case 'byo':
      return <RouterLink to="/byo" {...props} />;
    case 'byoEvents':
      return <RouterLink to="/byo/events" {...props} />;
    case 'node':
      return <RouterLink to="/node/$" params={{ _splat: route.nodeId }} {...props} />;
    case 'nodeEvents':
      return <RouterLink to="/node/$" params={{ _splat: `${route.nodeId}/events` }} {...props} />;
    case 'snapshot':
      return <RouterLink to="/snapshot/$frameId" params={{ frameId: route.frameId }} {...props} />;
    case 'snapshotEvents':
      return (
        <RouterLink to="/snapshot/$frameId/events" params={{ frameId: route.frameId }} {...props} />
      );
    default:
      return <a href={href} {...props} />;
  }
}
