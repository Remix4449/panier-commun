/* Coquille hors ligne : l'app s'ouvre sans réseau, les données vivent
   dans localStorage et repartent vers le foyer au retour de la connexion.

   La page part d'abord sur le réseau et retombe sur le cache : une mise à
   jour arrive donc dès le rechargement suivant, et non celui d'après. Les
   icônes et le manifeste, eux, sortent du cache d'abord. */
const CACHE = "panier-v9";
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

const keep = (req, res) => {
  if (res && res.ok) {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(req, copy));
  }
  return res;
};

self.addEventListener("fetch", ev => {
  const url = new URL(ev.request.url);
  if (ev.request.method !== "GET" || url.origin !== location.origin) return;

  // Jamais les données : un flux d'événements ou une réponse JSON n'a rien
  // à faire dans le cache de la coquille, et le mettre en cache le romprait.
  const accept = ev.request.headers.get("accept") || "";
  if (accept.includes("text/event-stream") || url.pathname.endsWith(".json")) return;

  const isPage = ev.request.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname.endsWith("/");
  if (isPage) {
    ev.respondWith(
      fetch(ev.request)
        .then(res => keep(ev.request, res))
        .catch(() => caches.match(ev.request).then(hit => hit || caches.match("./index.html")))
    );
    return;
  }

  ev.respondWith(
    caches.match(ev.request).then(hit => {
      const live = fetch(ev.request).then(res => keep(ev.request, res)).catch(() => hit);
      return hit || live;
    })
  );
});
