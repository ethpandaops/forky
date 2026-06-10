import { createFileRoute } from '@tanstack/react-router';

import AppRoute from './-AppRoute';

export const Route = createFileRoute('/byo')({
  component: () => <AppRoute byo />,
});
