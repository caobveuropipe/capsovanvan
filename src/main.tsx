import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register PWA Service Worker for Mobile Installability
if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    try {
      const swUrl = new URL('sw.js', window.location.href).href;
      navigator.serviceWorker
        .register(swUrl)
        .then((reg) => {
          console.log('PWA ServiceWorker active with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('PWA ServiceWorker registration notice:', err);
        });
    } catch (e) {
      console.warn('Could not determine ServiceWorker URL:', e);
    }
  });
}

