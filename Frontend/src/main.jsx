import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './app/store';
import App from './App';
import './index.css';
import './i18n/i18n'; // initialise i18next before first render

// PWA update handled automatically by vite-plugin-pwa (registerType: 'autoUpdate')
// The plugin injects registerSW.js which manages registration + update prompts

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
