/* Coquille hors ligne : l'app s'ouvre sans réseau, les données vivent
   dans localStorage et repartent vers le foyer au retour de la connexion. */
const CACHE = "panier-v1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", ev => {
  ev.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", ev => {
  ev.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", ev => {
  const url = new URL(ev.request.url);
  if (ev.request.method !== "GET" || url.origin !== location.origin) return;
  ev.respondWith(
    caches.match(ev.request).then(hit => {
      const live = fetch(ev.request)
        .then(res => {
          if (res && res.ok) caches.open(CACHE).then(c => c.put(ev.request, res.clone()));
          return res;
        })
        .catch(() => hit);
      return hit || live;
    })
  );
});
