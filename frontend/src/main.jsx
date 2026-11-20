import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/react-app.css';
import App from './App.jsx';

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
