import rss from '@astrojs/rss'
import sanitizeHtml from 'sanitize-html'
import { getEnv } from '../lib/env'
import { searchPosts } from '../lib/search'
import { getChannelInfo } from '../lib/telegram'

export async function GET(Astro) {
  const { SITE_URL } = Astro.locals
  const tag = Astro.url.searchParams.get('tag')
  const enableLocalSearch = getEnv(import.meta.env, Astro, 'ENABLE_LOCAL_SEARCH') === 'true'

  let posts = []
  let title = 'RSS Feed'
  let description = 'RSS feed'

  if (enableLocalSearch) {
    // 使用本地搜索
    const searchResult = await searchPosts(tag ? `#${tag}` : '', Astro)
    posts = searchResult.posts || []
    title = tag ? `${tag} | RSS Feed` : 'RSS Feed'
    description = tag ? `RSS feed for tag: ${tag}` : 'RSS feed for all posts'
  }
  else {
    // 使用原来的Telegram API
    const channel = await getChannelInfo(Astro, {
      q: tag ? `#${tag}` : '',
    })
    posts = channel.posts || []
    title = tag ? `${tag} | ${channel.title}` : channel.title
    description = channel.description
  }

  const request = Astro.request
  const url = new URL(request.url)
  url.pathname = SITE_URL
  url.search = ''

  const response = await rss({
    title,
    description,
    site: url.origin,
    trailingSlash: false,
    stylesheet: getEnv(import.meta.env, Astro, 'RSS_BEAUTIFY') ? '/rss.xsl' : undefined,
    items: posts.map(item => ({
      link: `posts/${item.id}`,
      title: item.title,
      description: item.description,
      pubDate: new Date(item.datetime),
      content: sanitizeHtml(item.content, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'video', 'audio']),
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          video: ['src', 'width', 'height', 'poster'],
          audio: ['src', 'controls'],
          img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading', 'class'],
        },
        exclusiveFilter(frame) {
          return frame.tag === 'img' && frame.attribs?.class?.includes('modal-img')
        },
      }),
    })),
  })

  response.headers.set('Content-Type', 'text/xml')
  response.headers.set('Cache-Control', 'public, max-age=3600')

  return response
}
