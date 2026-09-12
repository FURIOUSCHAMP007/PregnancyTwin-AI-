import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initOfflineFetchInterceptor } from './utils/offlineSync';

// Initialize the global offline fetch interceptor for low-connectivity environments
initOfflineFetchInterceptor();

// Register standard Service Worker for offline asset caching in clinics
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('PregnancyTwin Service Worker registered successfully:', reg.scope);
      })
      .catch((err) => {
        console.error('Service Worker registration failed:', err);
      });
  });
} else if ('serviceWorker' in navigator) {
  // In development, also register service worker for testing offline modes
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('PregnancyTwin Service Worker registered (development):', reg.scope);
      })
      .catch((err) => {
        console.warn('Dev Service Worker register failed (expected in some local environments):', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

