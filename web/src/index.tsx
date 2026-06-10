import './index.css';
import React from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en.json';
import ReactDOM from 'react-dom/client';

import ErrorBoundary from '@app/ErrorBoundary';

import { routeTree } from './routeTree.gen';

const queryClient = new QueryClient();
TimeAgo.addDefaultLocale(en);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// @ts-expect-error ignore
if (process.env.NODE_ENV === 'development' && import.meta.env.VITE_MOCK) {
  const { worker } = await import('@app/mocks/browser');
  await worker.start();
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
