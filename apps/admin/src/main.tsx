import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import { Notifications } from '@mantine/notifications';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { adminTheme } from './app/theme';
import { store } from './app/store';
import App from './app/App';
import './i18n';
import { DatesProviderBridge } from './i18n/DatesProviderBridge';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <MantineProvider theme={adminTheme}>
        <Notifications
          position="bottom-right"
          zIndex={10000}
          limit={5}
          styles={{
            notification: {
              root: {
                boxShadow: '0 10px 36px rgba(15, 36, 25, 0.32)',
              },
            },
          }}
        />
        <DatesProviderBridge>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </DatesProviderBridge>
      </MantineProvider>
    </Provider>
  </StrictMode>,
);
