import { useCallback } from 'react';

import { useLocation, useNavigate } from '@tanstack/react-router';

import { parseAppRoute } from '@utils/routes';

export type NavigateFn = (to: string, options?: { replace?: boolean }) => void;

/**
 * Forky's components pass plain app path strings around. These hooks are the
 * boundary that turns those paths into TanStack Router's typed route targets.
 */

/** The current pathname. */
export function usePathname(): string {
  return useLocation({ select: location => location.pathname });
}

/** Navigate to an app path string via the matching typed route. */
export function useAppNavigate(): NavigateFn {
  const routerNavigate = useNavigate();

  return useCallback<NavigateFn>(
    (to, options) => {
      const route = parseAppRoute(to);

      switch (route?.kind) {
        case 'home':
          routerNavigate({ to: '/', replace: options?.replace });
          return;
        case 'events':
          routerNavigate({ to: '/events', replace: options?.replace });
          return;
        case 'byo':
          routerNavigate({ to: '/byo', replace: options?.replace });
          return;
        case 'byoEvents':
          routerNavigate({ to: '/byo/events', replace: options?.replace });
          return;
        case 'node':
          routerNavigate({
            to: '/node/$nodeId',
            params: { nodeId: route.nodeId },
            replace: options?.replace,
          });
          return;
        case 'nodeEvents':
          routerNavigate({
            to: '/node/$nodeId/events',
            params: { nodeId: route.nodeId },
            replace: options?.replace,
          });
          return;
        case 'snapshot':
          routerNavigate({
            to: '/snapshot/$frameId',
            params: { frameId: route.frameId },
            replace: options?.replace,
          });
          return;
        case 'snapshotEvents':
          routerNavigate({
            to: '/snapshot/$frameId/events',
            params: { frameId: route.frameId },
            replace: options?.replace,
          });
          return;
        default:
          window.location.assign(to);
      }
    },
    [routerNavigate],
  );
}
