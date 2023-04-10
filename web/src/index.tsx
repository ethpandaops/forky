import '@styles/global.css';
import React from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en.json';
import ReactDOM from 'react-dom/client';
import { Route, Switch } from 'wouter';

import App from '@app/App';
import ErrorBoundary from '@app/ErrorBoundary';

const queryClient = new QueryClient();
TimeAgo.addDefaultLocale(en);

if (process.env.NODE_ENV === 'development' && import.meta.env.VITE_MOCK) {
  const { worker } = await import('@app/mocks/browser');
  worker.start({
    waitUntilReady: true,
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Switch>
          <Route path="/node/:node">{({ node }) => <App node={node} />}</Route>
          <Route path="/snapshot/:id">{({ id }) => <App frameId={id} />}</Route>
          <Route>
            <App />
          </Route>
        </Switch>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
