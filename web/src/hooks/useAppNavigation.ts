import { useCallback } from 'react';

import { useLocation, useNavigate } from '@tanstack/react-router';

export type NavigateFn = (to: string, options?: { replace?: boolean }) => void;

/**
 * Forky composes paths (`/byo`, `/node/<id>`, `/snapshot/<id>`, optional
 * `/events` suffix) on a single catch-all splat route, so navigation targets
 * are plain path strings rather than typed route literals. These hooks are
 * the app's routing primitives over that scheme.
 */

/** The current pathname. */
export function usePathname(): string {
  return useLocation({ select: location => location.pathname });
}

/** Navigate to an app path string via the catch-all splat route. */
export function useAppNavigate(): NavigateFn {
  const routerNavigate = useNavigate();

  return useCallback<NavigateFn>(
    (to, options) => {
      if (to === '/') {
        routerNavigate({ to: '/', replace: options?.replace });

        return;
      }

      routerNavigate({
        to: '/$',
        params: { _splat: to.replace(/^\//, '') },
        replace: options?.replace,
      });
    },
    [routerNavigate],
  );
}
