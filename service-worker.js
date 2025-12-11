const CACHE_NAME = "looped-cache-v2";
const CACHE_ASSETS = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/offline.html",
  "/MIX 2 Mind Control .wav",
  "/Black Sheep mix 4 .wav",
  "/5 A.M in Dubtown FINAL.wav",
  "/Love Letter 1.wav"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHE_ASSETS))
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).catch(() => caches.match("/offline.html"))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((resp) => resp || fetch(e.request))
  );
});
