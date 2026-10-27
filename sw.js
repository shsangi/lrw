const CACHE_NAME = 'reader-pwa-v4'; // BUMPED TO V4 TO CLEAR OLD FAVICON CACHE
const ASSETS = [
  './', 
  './index.html', 
  './manifest.json', 
  './icon-180.png', 
  './icon-192.png', 
  './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Don't cache Apps Script requests
  if (url.origin === 'https://script.google.com') return;
  
  // Network First for everything else
  e.respondWith(
    fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      return res;
    }).catch(() => caches.match(e.request))
  );
});
