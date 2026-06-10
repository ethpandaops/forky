import { createFileRoute } from '@tanstack/react-router';

import AppRoute from './-AppRoute';

export const Route = createFileRoute('/node/$nodeId')({
  component: function NodeRoute() {
    const { nodeId } = Route.useParams();

    return <AppRoute node={nodeId} />;
  },
});
