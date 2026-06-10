import { createRootRoute, createRoute } from '@tanstack/react-router';

const rootRoute = createRootRoute();

export const storyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '$',
});

rootRoute.addChildren([storyRoute]);
