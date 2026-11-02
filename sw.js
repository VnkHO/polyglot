// Écho hors ligne : réseau d'abord, cache en secours.
// Les e/*.bin gardent leur nom d'une publication à l'autre. Ce fichier était copié tel quel
// (cache « echo-v1 ») : le navigateur ne réinstallait pas le worker et ne jetait pas ce cache.
// Si le fetch du worker est servi par le cache HTTP (GitHub Pages, max-age=600), le même URL
// renvoie l'ancien octet ; un rechargement qui ignore le worker voyait seul le fichier nouveau.
// La version ci-dessous est l'empreinte du site, injectée à la publication. L'activation
// efface les autres caches. Le réseau ignore le cache HTTP.
const CACHE = "echo-ac25e1f402ed6d5f";
const SHELL = ["./","vault.json","manifest.webmanifest"];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(SHELL.map(async u => {
      const res = await fetch(new URL(u, self.registration.scope), { cache: "reload" });
      if (res.ok) await c.put(u, res);
    }));
  })().catch(() => {}));
});

self.addEventListener("activate", e => e.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
  await self.clients.claim();
})()));

self.addEventListener("fetch", e => {
  const r = e.request;
  const url = new URL(r.url);
  if (r.method !== "GET" || url.origin !== location.origin || url.pathname.endsWith("/sw.js")) return;
  e.respondWith(fetch(r.url, { cache: "reload", credentials: "same-origin" }).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); }
    return res;
  }).catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || (r.mode === "navigate" ? caches.match("./") : Response.error()))));
});
