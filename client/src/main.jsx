import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

/**
 * main.jsx — React entry point.
 *
 * StrictMode renders components twice in development to help detect
 * side effects and deprecated API usage. It has no effect in production.
 *
 * The Redux <Provider> is inside App.jsx (not here) so it's co-located
 * with the Router — keeping main.jsx minimal.
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
