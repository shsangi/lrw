const CACHE_NAME = 'reader-pwa-v5'; // BUMPED TO V5 TO PICK UP NEW INSTALL BANNER
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];

// Install: pre-cache shell assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

// Activate: delete old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: never touch Apps Script; network-first for everything else,
// with a cached index.html fallback for navigation requests.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Don't cache or intercept Apps Script calls
  if (url.origin === 'https://script.google.com') return;
  if (url.origin === 'https://accounts.google.com') return;

  // Only handle GET
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache a copy for successful same-origin/basic responses
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone)).catch(() => {});
        }
        return res;
      })
      .catch(() => {
        // Offline fallback
        return caches.match(e.request).then(hit => {
          if (hit) return hit;
          // For navigation requests, fall back to cached shell
          if (e.request.mode === 'navigate') return caches.match('./index.html');
          return Response.error();
        });
      })
  );
});