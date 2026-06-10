import { createFileRoute } from '@tanstack/react-router';

import AppRoute from './-AppRoute';
import { nodePath } from '@utils/routes';

export const Route = createFileRoute('/node_/$nodeId/events')({
  component: function NodeEventsRoute() {
    const { nodeId } = Route.useParams();

    return <AppRoute node={nodeId} eventsOpen eventsCloseTo={nodePath(nodeId)} />;
  },
});
