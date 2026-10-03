/* 学习航线 service worker
   Online: always ask the network first, so a new version shows up the next time the app opens.
   Offline or slow network: fall back to the copy saved on this device. */
const PREFIX = 'study-route-shell-';
const CACHE = PREFIX + 'v1';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
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
      // only this app's own old caches: another app may live on the same address
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function fromCache(request) {
  return caches.open(CACHE).then((c) => c.match(request, { ignoreSearch: true })).then((hit) => {
    if (hit) return hit;
    return request.mode === 'navigate' ? caches.open(CACHE).then((c) => c.match('./index.html')) : undefined;
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
