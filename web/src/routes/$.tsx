import { createFileRoute } from '@tanstack/react-router';

import RouteView from './-RouteView';

export const Route = createFileRoute('/$')({
  component: RouteView,
});
