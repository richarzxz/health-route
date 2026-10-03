/* 健康航线 service worker
   Online: always ask the network first, so a new version shows up the next time the app opens.
   Offline or slow network: fall back to the copy saved on this device. */
const CACHE = 'health-route-shell-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];
const WAIT_MS = 3500;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function fromCache(request) {
  return caches.match(request, { ignoreSearch: true }).then((hit) => {
    if (hit) return hit;
    return request.mode === 'navigate' ? caches.match('./index.html') : undefined;
  });
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(new Promise((resolve, reject) => {
    let settled = false;
    const finish = (response) => { if (!settled && response) { settled = true; resolve(response); } };

    // a slow connection should not leave the app blank: after a short wait, show the saved copy
    const timer = setTimeout(() => { fromCache(request).then(finish); }, WAIT_MS);

    fetch(request, { cache: 'no-cache' }).then((response) => {
      clearTimeout(timer);
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then((c) => c.put(request, copy));
      }
      finish(response);
    }).catch(() => {
      clearTimeout(timer);
      fromCache(request).then((hit) => {
        if (hit) finish(hit);
        else if (!settled) { settled = true; reject(new TypeError('offline and not cached')); }
      });
    });
  }));
});
