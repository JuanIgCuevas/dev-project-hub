const CACHE_NAME = 'devhub-shell-v1'
const CORE_FILES = [
  '/',
  '/demo',
  '/site.webmanifest',
  '/favicon.svg?v=3',
  '/favicon-32.png?v=3',
  '/apple-touch-icon.png?v=3',
  '/pwa-192.png',
  '/pwa-512.png',
]

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_FILES)))
})

self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))),
    self.clients.claim(),
  ]))
})

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      const copy = response.clone()
      caches.open(CACHE_NAME).then(cache => cache.put(request, copy))
      return response
    }).catch(async () => (await caches.match(request)) || (await caches.match('/'))))
    return
  }

  if (!['style', 'script', 'image', 'font'].includes(request.destination)) return
  event.respondWith(caches.match(request).then(cached => {
    const fresh = fetch(request).then(response => {
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()))
      return response
    }).catch(() => cached)
    return cached || fresh
  }))
})
