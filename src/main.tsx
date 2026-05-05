import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { initSentry } from '@/app/sentry';
import '@/i18n';
import '@/app/index.css';

// Init before render so any React-render errors are captured.
initSentry();

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root introuvable dans index.html');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
