import { createFileRoute } from '@tanstack/react-router';

import AppRoute from './-AppRoute';

export const Route = createFileRoute('/events')({
  component: () => <AppRoute eventsOpen eventsCloseTo="/" />,
});
