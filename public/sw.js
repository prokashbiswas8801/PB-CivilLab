// PB CivilLab — Offline Progressive Web App Service Worker
// Version: pb-civillab-v2.0.0
// Author: Prokash Biswas | Calculate Smarter. Build Better.

const CACHE_NAME = 'pb-civillab-v2';

const STATIC_PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './logo.svg',
  './logo-icon.svg',
];

// Install Event: Pre-cache core offline shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Intelligent offline caching strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // CRITICAL PRIVACY & SECURITY RULE:
  // NEVER cache API requests (such as /api/*) or authentication tokens.
  if (url.pathname.startsWith('/api/') || event.request.method !== 'GET') {
    return; // Pass through to network directly without touching the Cache API
  }

  // Handle same-origin assets & navigation requests
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Cache hit: return immediately, and fetch in background for cache refresh (Stale-While-Revalidate)
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse.clone());
              });
            }
          })
          .catch(() => {
            // Network failure in background is fine since we served from cache
          });
        return cachedResponse;
      }

      // Cache miss: attempt network fetch
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          // Cache dynamically loaded assets (scripts, styles, icons)
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          // If offline and requesting navigation, return index.html from cache
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html') || caches.match('/');
          }
          return new Response('Network offline and asset not cached', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' }),
          });
        });
    })
  );
});
