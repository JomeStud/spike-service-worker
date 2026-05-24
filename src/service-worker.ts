/// <reference lib="webworker" />

const CACHE_NAME = "offline-pwa-spike-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.webmanifest",
  "./offline-data.json",
  "./main.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

const serviceWorker = self as unknown as ServiceWorkerGlobalScope;

self.addEventListener("install", (event) => {
  const installEvent = event as ExtendableEvent;

  installEvent.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => serviceWorker.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  const activateEvent = event as ExtendableEvent;

  activateEvent.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => serviceWorker.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const fetchEvent = event as FetchEvent;
  const { request } = fetchEvent;

  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== serviceWorker.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    fetchEvent.respondWith(
      fetch(request).catch(async () => (await caches.match("./index.html")) ?? Response.error())
    );
    return;
  }

  fetchEvent.respondWith(
    fetch(request)
      .then((response) => {
        const responseClone = response.clone();
        void caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        return response;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(request);
        return cachedResponse ?? (await caches.match("./index.html")) ?? Response.error();
      })
  );
});
