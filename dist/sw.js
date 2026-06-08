// ── Service Worker — Glyph ─────────────────────────────────────────────────────
const CACHE_VERSION = 'glyph-v7';

// Assets served network-first (always get latest on reload)
const NETWORK_FIRST = ['/', '/index.html', '/app.js'];

// Assets served cache-first (stable, rarely change)
const CACHE_FIRST = ['/style.css', '/manifest.webmanifest'];

const ALL_ASSETS = [...NETWORK_FIRST, ...CACHE_FIRST];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(c => c.addAll(ALL_ASSETS))
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

  const path = url.pathname;
  const isNetworkFirst =
    e.request.mode === 'navigate' ||
    e.request.headers.get('accept')?.includes('text/html') ||
    NETWORK_FIRST.includes(path);

  if (isNetworkFirst) {
    // Network-first: always try network, fall back to cache offline
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_VERSION).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Cache-first with background revalidation for stable assets
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
