// Minimal service worker — mainly here to satisfy PWA installability
// requirements (Chrome/Android require a registered SW with a fetch handler
// before showing an install prompt). Caches the app shell so it also opens
// offline; everything else (your food/avoid/body data) lives in
// localStorage/IndexedDB via the sync flow already in app.js, not here.

const CACHE_NAME = "nutriwise-shell-v2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./app.js",
  "./sync.js",
  "./manifest.json",
  "./icon192.png",
  "./icon512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .catch(() => {}) // don't block install if an icon path etc. is missing
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for navigation/HTML so you always get the latest app.js
// logic; cache-first fallback for everything else so it still opens offline.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached =>
      cached || fetch(event.request).then(res => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
        return res;
      }).catch(() => cached)
    )
  );
});
