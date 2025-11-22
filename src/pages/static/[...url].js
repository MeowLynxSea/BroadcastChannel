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
  let target = null

  try {
    target = new URL(params.url + url.search)
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
    // Log the error for debugging
    console.error(`Static proxy error for ${target?.toString() || 'unknown'}:`, {
      name: error.name,
      message: error.message,
      code: error.code,
      errno: error.errno,
      stack: error.stack,
    })

    // Determine appropriate status and error message based on error type
    let errorMessage = 'Failed to fetch resource'
    let statusCode = 500

    if (error.name === 'TimeoutError' || error.code === 'TIMEOUT') {
      errorMessage = `Request timeout after 120 seconds`
      statusCode = 408
    }
    else if (error.code === 'ECONNRESET') {
      errorMessage = 'Connection was reset by the remote server'
      statusCode = 502
    }
    else if (error.code === 'ENOTFOUND') {
      errorMessage = 'Domain name resolution failed'
      statusCode = 502
    }
    else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Connection refused by remote server'
      statusCode = 502
    }
    else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Connection timed out'
      statusCode = 504
    }
    else if (error.message.includes('fetch failed')) {
      // Extract more specific error from fetch failed message
      const networkError = error.message.replace(/^fetch failed:\s*/, '')
      errorMessage = `Network error: ${networkError}`
      statusCode = 502
    }

    // Return a detailed error response
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: {
          url: target?.toString() || 'unknown',
          errorType: error.name,
          code: error.code || 'UNKNOWN',
          originalMessage: error.message,
        },
      }),
      {
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
  }
}
