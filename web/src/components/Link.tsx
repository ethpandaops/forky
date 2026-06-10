import { MouseEventHandler, ReactNode } from 'react';

import { Link as RouterLink } from '@tanstack/react-router';

interface Props {
  href: string;
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  title?: string;
  children?: ReactNode;
}

/**
 * The app's link primitive: forky composes paths on a single catch-all splat
 * route, so links take a plain `href` path string and route it through the
 * splat param (see hooks/useAppNavigation.ts for the programmatic version).
 */
export default function Link({ href, ...props }: Props) {
  if (href === '/') {
    return <RouterLink to="/" {...props} />;
  }

  return <RouterLink to="/$" params={{ _splat: href.replace(/^\//, '') }} {...props} />;
}
