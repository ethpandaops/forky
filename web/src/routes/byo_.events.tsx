import { createFileRoute } from '@tanstack/react-router';

import AppRoute from './-AppRoute';

export const Route = createFileRoute('/byo_/events')({
  component: () => <AppRoute byo eventsOpen eventsCloseTo="/byo" />,
});
