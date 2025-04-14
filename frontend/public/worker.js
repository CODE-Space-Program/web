self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("static-assets").then((cache) => {
      return cache.addAll(["/3d/v1.glb"]); // cache .glb here
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});
