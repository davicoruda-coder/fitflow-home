const CACHE = "fitflow-home-v10";
const MEDIA_PREFIX = "/exercises/";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("fitflow-home-") && key !== CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Only cache exercise media. Do NOT intercept App Router / RSC / page
  // navigations — hijacking those causes stuck tab switches on mobile.
  const isExerciseMedia =
    url.pathname.startsWith(MEDIA_PREFIX) &&
    (url.pathname.endsWith(".mp4") ||
      url.pathname.endsWith(".webp") ||
      url.pathname.endsWith(".jpg") ||
      url.pathname.endsWith(".png"));

  if (!isExerciseMedia) return;

  event.respondWith(cacheFirst(event.request));
});

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    void cache.put(request, response.clone());
  }
  return response;
}
