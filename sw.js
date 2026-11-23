'use strict';
const V = 'zamanlayici-v4', SHELL = ['./', 'index.html', 'style.css', 'app.js', 'pass.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== V).map(n => caches.delete(n)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || !(u.origin === location.origin || /(^|\.)(googleapis|gstatic)\.com$/.test(u.hostname))) return;
  e.respondWith(caches.open(V).then(async c => {
    const hit = await c.match(r, { ignoreSearch: r.mode === 'navigate' });
    const net = fetch(r).then(res => { if (res.ok || res.type === 'opaque') c.put(r, res.clone()); return res; })
      .catch(() => hit || (r.mode === 'navigate' ? c.match('index.html') : Response.error()));
    if (hit) { e.waitUntil(net); return hit; }
    return net;
  }));
});
