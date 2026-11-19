const CACHE_NAME = 'mercaton-pwa-v3';
const APP_SHELL = [
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch((error) => {
        console.warn('No se pudo precargar toda la aplicación:', error);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith('mercaton-pwa-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const requestUrl = new URL(request.url);
  // No interceptar Firebase, Google Apps Script ni recursos de terceros.
  if (requestUrl.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match('./index.html');
          return cached || new Response('MERCATON no está disponible sin conexión.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        })
    );
    return;
  }

  // Para archivos estáticos locales: caché primero y actualización en segundo plano.
  const isStaticAsset = /\.(?:css|js|png|jpg|jpeg|webp|svg|ico|json|woff2?)$/i.test(requestUrl.pathname);
  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkRequest = fetch(request).then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        }).catch(() => null);
        return cached || networkRequest.then((response) => response || new Response('', { status: 503 }));
      })
    );
  }
});
