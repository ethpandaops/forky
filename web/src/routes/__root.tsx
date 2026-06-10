import { createRootRoute } from '@tanstack/react-router';

import App from '@app/App';
import NotFound from '@app/NotFound';
import { usePathname } from '@hooks/useAppNavigation';
import { parseAppRoute } from '@utils/routes';

/*
 * The root route renders the single, persistent <App> instance for every
 * view; the view config (node, snapshot, BYO, events overlay) is derived
 * from the location. Keeping one App alive across navigation is what
 * preserves player state — the focused time and play/pause — when moving
 * between the aggregated, node and snapshot views (the focus provider
 * reconciles route-driven props in place). The leaf files in src/routes/
 * only define the matchable, typed route tree; they render nothing.
 */
export const Route = createRootRoute({
  component: function Root() {
    const pathname = usePathname();
    const route = parseAppRoute(pathname);

    switch (route?.kind) {
      case 'home':
        return <App />;
      case 'events':
        return <App eventsOpen eventsCloseTo={route.closeTo} />;
      case 'byo':
        return <App byo />;
      case 'byoEvents':
        return <App byo eventsOpen eventsCloseTo={route.closeTo} />;
      case 'node':
        return <App node={route.nodeId} />;
      case 'nodeEvents':
        return <App node={route.nodeId} eventsOpen eventsCloseTo={route.closeTo} />;
      case 'snapshot':
        return <App frameId={route.frameId} />;
      case 'snapshotEvents':
        return <App frameId={route.frameId} eventsOpen eventsCloseTo={route.closeTo} />;
      default:
        return <NotFound />;
    }
  },
  notFoundComponent: NotFound,
});
