/* 学习航线 1.2.0 service worker
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
const HOME = new URL('./', self.location.href).pathname;

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
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(HOME) || url.pathname.slice(HOME.length).includes('/')) return;

  let finish;
  let fail;
  let settled = false;
  const responsePromise = new Promise((resolve, reject) => {
    finish = (response) => { if (!settled && response) { settled = true; resolve(response); } };
    fail = () => { if (!settled) { settled = true; reject(new TypeError('offline and not cached')); } };
  });
  const cached = () => fromCache(request).catch(() => undefined);
  const timer = setTimeout(() => { cached().then(finish); }, WAIT_MS);
  const work = fetch(request, { cache: 'no-cache' }).then(async (response) => {
    clearTimeout(timer);
    if (response.ok) {
      const copy = response.clone();
      const homeCopy = response.clone(), indexCopy = response.clone();
      finish(response);
      try {
        const cache = await caches.open(CACHE);
        await cache.put(request, copy);
        // Keep both entry URLs at the same version when a document is fetched.
        if (request.mode === 'navigate' && (url.pathname === HOME || url.pathname === HOME + 'index.html')) {
          await cache.put(new URL('./', self.location.href).href, homeCopy);
          await cache.put(new URL('./index.html', self.location.href).href, indexCopy);
        }
      } catch (e) { /* A failed cache write must not hide a valid network response. */ }
      return;
    }
    if (request.mode === 'navigate' && (response.status >= 500 || [404, 408, 429].includes(response.status))) {
      finish(await cached() || response);
    } else finish(response);
  }).catch(async () => {
    clearTimeout(timer);
    const hit = await cached();
    if (hit) finish(hit); else fail();
  });
  event.respondWith(responsePromise);
  event.waitUntil(work);
});
