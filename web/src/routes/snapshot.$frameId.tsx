import { createFileRoute } from '@tanstack/react-router';

/* Matcher only — the persistent <App> is rendered by the root route. */
export const Route = createFileRoute('/snapshot/$frameId')({});
