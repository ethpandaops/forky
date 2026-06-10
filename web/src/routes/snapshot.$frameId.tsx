import { createFileRoute } from '@tanstack/react-router';

import AppRoute from './-AppRoute';

export const Route = createFileRoute('/snapshot/$frameId')({
  component: function SnapshotRoute() {
    const { frameId } = Route.useParams();

    return <AppRoute frameId={frameId} />;
  },
});
