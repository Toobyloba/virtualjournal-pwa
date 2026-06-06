// ── Service Worker — Glyph ─────────────────────────────────────────────────────
const CACHE_VERSION = 'glyph-v4';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.webmanifest',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(c => c.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Only handle http/https — silently ignore chrome-extension://, data:, blob:, etc.
  if (!url.protocol.startsWith('http')) return;
  if (e.request.method !== 'GET') return;

  const isNavigation =
    e.request.mode === 'navigate' ||
    e.request.headers.get('accept')?.includes('text/html');

  if (isNavigation) {
    // Network-first for HTML so every reload gets the latest deploy
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
    // Cache-first with background revalidation for JS/CSS/assets
    e.respondWith(
      caches.open(CACHE_VERSION).then(async cache => {
        const cached = await cache.match(e.request);
        const networkFetch = fetch(e.request).then(res => {
          if (res.ok) cache.put(e.request, res.clone());
          return res;
        }).catch(() => cached);
        return cached ?? networkFetch;
      })
    );
  }
});
