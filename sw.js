const CACHE_NAME = 'reader-pwa-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './reader_logo.jpeg'
];

// Install: Cache files
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: Clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Cache first for local assets, network for Apps Script
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  
  // Don't cache Apps Script requests (always hit network)
  if (url.origin === 'https://script.google.com') {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      return cached || fetch(e.request).then((response) => {
        // Cache new static assets
        if (response.status === 200 && e.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return response;
      });
    })
  );
});
