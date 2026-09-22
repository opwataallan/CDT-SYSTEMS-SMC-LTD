import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for Android PWA, WebAPK caching, and offline support
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PWA] Cyber Dynamic updated. Refreshing cached assets.');
  },
  onOfflineReady() {
    console.log('[PWA] Cyber Dynamic is cached and ready to run offline on Android.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

