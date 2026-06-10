import { createFileRoute } from '@tanstack/react-router';

import AppRoute from './-AppRoute';
import { snapshotPath } from '@utils/routes';

export const Route = createFileRoute('/snapshot_/$frameId/events')({
  component: function SnapshotEventsRoute() {
    const { frameId } = Route.useParams();

    return <AppRoute frameId={frameId} eventsOpen eventsCloseTo={snapshotPath(frameId)} />;
  },
});
