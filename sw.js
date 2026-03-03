const CACHE_NAME = 'asertiva-crm-v3';
const BASE_URL = '/crmasertiva';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        BASE_URL + '/',
        BASE_URL + '/index.html',
        BASE_URL + '/manifest.json',
        BASE_URL + '/icons/icon-192.png',
        BASE_URL + '/icons/icon-512.png'
      ]).catch(() => {
        // Si falla alguno, no bloqueamos la instalación
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Solo manejar requests del mismo origen
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // CRÍTICO: Solo cachear respuestas exitosas (status 200)
        // Nunca cachear 404, 500, etc.
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Sin red: intentar desde caché
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Si no hay caché, devolver la página principal
          return caches.match(BASE_URL + '/index.html');
        });
      })
  );
});
