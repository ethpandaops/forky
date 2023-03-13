import '@styles/global.css';
import React from 'react';

import ReactDOM from 'react-dom/client';

import Home from '@pages/home';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Home />
  </React.StrictMode>,
);
