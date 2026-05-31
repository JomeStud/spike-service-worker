/// <reference lib="webworker" />

const CACHE_NAME = "offline-pwa-spike-v2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.webmanifest",
  "./offline-data.json",
  "./main.js",
  "./icons/logo.svg"
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
        if (cachedResponse) {
          return cachedResponse;
        }

        // Legacy icon requests — serve the single SVG logo instead of 404
        const pathname = requestUrl.pathname;
        if (
          pathname.endsWith("/icons/icon-512.png") ||
          pathname.endsWith("/icons/icon-192.png") ||
          pathname.endsWith("/icons/apple-touch-icon.png")
        ) {
          const logo = await caches.match("./icons/logo.svg");
          if (logo) {
            return logo;
          }
          try {
            return await fetch("./icons/logo.svg");
          } catch {
            return (await caches.match("./index.html")) ?? Response.error();
          }
        }

        return (await caches.match("./index.html")) ?? Response.error();
      })
  );
});

self.addEventListener("notificationclick", (event) => {
  const notificationEvent = event as NotificationEvent;
  notificationEvent.notification.close();

  notificationEvent.waitUntil(
    serviceWorker.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const focusedClient = clients.find((client) => "focus" in client) as WindowClient | undefined;
        if (focusedClient) {
          return focusedClient.focus();
        }
        return serviceWorker.clients.openWindow("./");
      })
  );
});
