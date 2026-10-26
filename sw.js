// Écho hors ligne : réseau d'abord, cache en secours. Les fichiers chiffrés (e/*.bin) gardent leur nom
// d'une publication à l'autre, donc on ne sert jamais le cache quand le réseau répond.
const CACHE = "echo-v1";
self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(["./", "vault.json", "manifest.webmanifest"])).catch(() => {}));
});
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); }
    return res;
  }).catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || (r.mode === "navigate" ? caches.match("./") : Response.error()))));
});
