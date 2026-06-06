// ── Service Worker — Glyph ─────────────────────────────────────────────────────
//
// Strategy:
//   • HTML (navigation requests)  → network-first, fall back to cache
//   • JS / CSS / other assets     → cache-first, fall back to network
//
// Bump CACHE_VERSION on every deploy so stale assets are evicted immediately.

const CACHE_VERSION = 'glyph-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.webmanifest',
];

// Install: pre-cache static assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(c => c.addAll(STATIC_ASSETS))
  );
  // Activate immediately, don't wait for old SW clients to close
  self.skipWaiting();
});

// Activate: delete every cache that isn't the current version
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      )
    )
  );
  // Take control of all open tabs immediately
  self.clients.claim();
});

// Fetch: network-first for HTML, cache-first for everything else
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const isNavigation =
    e.request.mode === 'navigate' ||
    e.request.headers.get('accept')?.includes('text/html');

  if (isNavigation) {
    // Network-first: always try to get fresh HTML, fall back to cache if offline
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Cache-first: serve from cache, update cache in background (stale-while-revalidate)
    e.respondWith(
      caches.open(CACHE_VERSION).then(async cache => {
        const cached = await cache.match(e.request);
        const networkFetch = fetch(e.request).then(res => {
          cache.put(e.request, res.clone());
          return res;
        });
        return cached ?? networkFetch;
      })
    );
  }
});
