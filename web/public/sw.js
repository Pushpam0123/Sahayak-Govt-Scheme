// Sahayak Service Worker (PWA Offline Support)
const CACHE_NAME = 'sahayak-v1';
const PRECACHE_ASSETS = [
  '/',
  '/schemes',
  '/services',
  '/ask',
  '/check',
  '/saved',
  '/privacy',
  '/manifest.json',
];

// Install: precache app shell and static routes.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache failed for some assets:', err);
      });
    })
  );
});

// Activate: clean up outdated caches.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// User-triggered update: only skip waiting when user explicitly accepts
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch handling
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Only handle GET requests; never intercept POST/PUT/DELETE
  if (request.method !== 'GET') {
    return;
  }

  // 2. Sensitive endpoints that MUST NEVER be cached
  // Eligibility decisions, chat streaming/Q&A, and health checks
  if (
    url.pathname.includes('/api/v1/eligibility') ||
    url.pathname.includes('/api/v1/chat') ||
    url.pathname.includes('/api/v1/health')
  ) {
    return;
  }

  // 3. Scheme API endpoints: Network-first falling back to timestamped cache
  if (url.pathname.startsWith('/api/v1/schemes')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              // Append timestamp header to the cached response
              copy.blob().then((blob) => {
                const headers = new Headers(copy.headers);
                headers.set('x-sahayak-cached-at', new Date().toISOString());
                const timestampedResponse = new Response(blob, {
                  status: copy.status,
                  statusText: copy.statusText,
                  headers,
                });
                cache.put(request, timestampedResponse);
              });
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) {
              return cached;
            }
            return new Response(
              JSON.stringify({ error: 'Network unavailable and scheme not cached.' }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              }
            );
          });
        })
    );
    return;
  }

  // 4. HTML Navigation requests: Network-first falling back to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            return caches.match('/');
          });
        })
    );
    return;
  }

  // 5. Static assets: Stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
