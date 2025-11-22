const targetWhitelist = [
  't.me',
  'telegram.org',
  'telegram.me',
  'telegram.dog',
  'cdn-telegram.org',
  'telesco.pe',
  'yandex.ru',
]

// Cache for static proxy responses
const staticCache = new Map()
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes cache
const MAX_CACHE_SIZE = 100 // Maximum number of items to cache

// Clean up expired cache entries
function cleanupCache() {
  const now = Date.now()
  for (const [key, item] of staticCache.entries()) {
    if (now - item.timestamp >= CACHE_TTL) {
      staticCache.delete(key)
    }
  }

  // If cache is still too large, remove oldest entries
  if (staticCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(staticCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)

    const toRemove = entries.slice(0, staticCache.size - MAX_CACHE_SIZE)
    toRemove.forEach(([key]) => staticCache.delete(key))
  }
}

// Run cleanup every 10 minutes
setInterval(cleanupCache, 10 * 60 * 1000)

export async function GET({ request, params, url }) {
  try {
    const target = new URL(params.url + url.search)
    if (!targetWhitelist.some(domain => target.hostname.endsWith(domain))) {
      return Response.redirect(target.toString(), 302)
    }

    // Create cache key from URL
    const cacheKey = target.toString()

    // Check if we have a cached response
    const cachedItem = staticCache.get(cacheKey)
    if (cachedItem && Date.now() - cachedItem.timestamp < CACHE_TTL) {
      return new Response(cachedItem.body, cachedItem.options)
    }

    const fetchOptions = {
      ...request,
      signal: AbortSignal.timeout(120000), // 120 second timeout for images
    }

    const response = await fetch(target.toString(), fetchOptions)

    // Clone the response to store it in cache
    const responseClone = response.clone()

    // Store the response in cache
    const buffer = await responseClone.arrayBuffer()
    staticCache.set(cacheKey, {
      body: buffer,
      options: {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      },
      timestamp: Date.now(),
    })

    // Run cleanup if cache is getting large
    if (staticCache.size > MAX_CACHE_SIZE * 0.8) {
      cleanupCache()
    }

    // Return original response
    return new Response(response.body, response)
  }
  catch (error) {
    // Check if this is a timeout error
    if (error.name === 'TimeoutError') {
      return new Response('Request timeout', { status: 408 })
    }
    return new Response(error.message, { status: 500 })
  }
}
