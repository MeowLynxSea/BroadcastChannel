// Avatar Proxy API - Server-side proxy for Gravatar avatars
// Prevents direct Gravatar requests and improves privacy

import { createHash } from 'node:crypto'

export async function GET({ request }) {
  try {
    const url = new URL(request.url)
    const email = url.searchParams.get('email')
    const size = url.searchParams.get('size') || '48'
    const defaultAvatar = url.searchParams.get('default') || 'mp'
    const rating = url.searchParams.get('rating') || 'g'

    if (!email) {
      return new Response('Missing email parameter', { status: 400 })
    }

    // Generate the hash for the email (lowercase and trimmed)
    const emailHash = createHash('md5').update(email.toLowerCase().trim()).digest('hex')

    // Construct the Gravatar URL
    const gravatarUrl = `https://www.gravatar.com/avatar/${emailHash}?d=${defaultAvatar}&s=${size}&r=${rating}`

    // Fetch the avatar from Gravatar
    const response = await fetch(gravatarUrl)

    if (!response.ok) {
      return new Response('Failed to fetch avatar', { status: response.status })
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/png'

    // Return the image with proper caching headers
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-Proxy-Cache': 'HIT',
      },
    })
  }
  catch (error) {
    console.error('Avatar proxy error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}
