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

const OFFLINE_FALLBACK_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Not Available Offline — Sahayak</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #090d16; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; box-sizing: border-box; }
    .card { max-width: 460px; width: 100%; text-align: center; background-color: #111827; border: 1px solid #1f2937; border-radius: 20px; padding: 36px 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .badge { display: inline-flex; align-items: center; gap: 6px; background-color: #451a03; color: #fbbf24; border: 1px solid rgba(251,191,36,0.3); font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; margin-bottom: 18px; }
    h1 { font-size: 22px; font-weight: 800; margin: 0 0 10px 0; color: #f8fafc; }
    p { font-size: 15px; color: #94a3b8; line-height: 1.6; margin: 0 0 24px 0; }
    .btn { display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px; padding: 12px 24px; border-radius: 12px; transition: background-color 0.15s ease; }
    .btn:hover { background-color: #2563eb; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Offline</div>
    <h1>Page Not Saved Offline</h1>
    <p>This government scheme page has not been cached on this device yet. Please connect to the internet to load its official eligibility rules and guidelines.</p>
    <a href="/" class="btn">Return to Home</a>
  </div>
</body>
</html>`;

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

  // 3. HTML Navigation requests: Network-first, stamping cached responses with provenance timestamp
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            const cachedAt = new Date().toISOString();

            copy.text().then((htmlText) => {
              // Inject provenance stamp into head
              const metaStamp = `<meta name="sahayak-cached-at" content="${cachedAt}"><script id="sw-stamp">window.__SW_CACHED_AT__="${cachedAt}";</script></head>`;
              const stampedHtml = htmlText.includes('</head>')
                ? htmlText.replace('</head>', metaStamp)
                : htmlText + `<meta name="sahayak-cached-at" content="${cachedAt}">`;

              const headers = new Headers(copy.headers);
              headers.set('x-sahayak-cached-at', cachedAt);
              headers.set('Content-Type', 'text/html; charset=utf-8');

              const stampedResponse = new Response(stampedHtml, {
                status: copy.status,
                statusText: copy.statusText,
                headers,
              });

              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, stampedResponse);
              });
            }).catch((err) => {
              console.warn('[SW] Stamping navigation cache failed:', err);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) return cached;

            // Return truthful offline message page (never return homepage at scheme URL)
            return new Response(OFFLINE_FALLBACK_PAGE, {
              status: 503,
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });
          });
        })
    );
    return;
  }

  // 4. Static assets (_next/static, fonts, icons): Stale-while-revalidate
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
