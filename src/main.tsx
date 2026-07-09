import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register service worker for Web Push notifications
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('ServiceWorker registration successful with scope: ', reg.scope);
        // Force checking for updates immediately on load to trigger skipWaiting & claim
        reg.update().catch(err => console.warn('ServiceWorker update check failed:', err));
      })
      .catch((err) => {
        console.error('ServiceWorker registration failed: ', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
