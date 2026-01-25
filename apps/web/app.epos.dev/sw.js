const CACHE_NAME = 'offline-cache-v2'
const ASSETS = ['/', '/favicon.svg']

// Install event - caching assets
self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      await cache.addAll(ASSETS)
    })(),
  )
})

// Fetch event - serving from cache
self.addEventListener('fetch', event => {
  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(event.request)
      if (cachedResponse) return cachedResponse
      return fetch(event.request)
    })(),
  )
})
