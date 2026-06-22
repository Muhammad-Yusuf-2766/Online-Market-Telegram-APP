import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@telegram-apps/telegram-ui/dist/styles.css';
import { AppProviders } from './app/providers/AppProviders';
import App from './app/App';
import './i18n';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);
