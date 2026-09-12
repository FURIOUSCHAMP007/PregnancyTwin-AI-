/**
 * PregnancyTwin AI - Offline Service Worker
 * Implements offline precaching for clinical UI assets and standard fonts
 * to allow loading the application shell in rural/disconnected environments.
 */

const CACHE_NAME = 'pregnancy-twin-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css',
  '/src/App.tsx',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap'
];

// Install Event - Precache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Precaching static clinical shell assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate Event - Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing deprecated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clientsClaim();
    })
  );
});

// Fetch Event - Serve Cached Assets when Offline
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip API requests: handled elegantly by the client-side interceptor with optimistic updates
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Handle static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return from cache, and optionally fetch in background to keep cache updated (Stale-While-Revalidate)
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => {
            // Silently catch fetch errors offline
          });
        return cachedResponse;
      }

      // If not in cache, fallback to network
      return fetch(event.request).catch(() => {
        // If navigation request fails, return cached index.html (SPA Fallback)
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
