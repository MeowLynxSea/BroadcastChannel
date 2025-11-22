import { getEnv } from './lib/env.js'
import { updateSearchIndex } from './lib/search/index.js'

export async function onRequest(context, next) {
  context.locals.SITE_URL = `${import.meta.env.SITE ?? ''}${import.meta.env.BASE_URL}`
  context.locals.RSS_URL = `${context.locals.SITE_URL}rss.xml`
  context.locals.RSS_PREFIX = ''

  if (context.url.pathname.startsWith('/search') && context.params.q?.startsWith('#')) {
    const tag = context.params.q.replace('#', '')
    context.locals.RSS_URL = `${context.locals.SITE_URL}rss.xml?tag=${tag}`
    context.locals.RSS_PREFIX = `${tag} | `
  }

  // 在后台更新搜索索引（非阻塞） - 只有在启用本地搜索时
  if ((context.url.pathname.startsWith('/search') || context.url.pathname.startsWith('/rss.xml'))
    && getEnv(import.meta.env, context, 'ENABLE_LOCAL_SEARCH') === 'true') {
    updateSearchIndex(context, false).catch((error) => {
      console.error('Error updating search index in middleware:', error)
    })
  }

  const response = await next()

  // 创建新的response对象来避免immutable错误
  if (!response.bodyUsed && response.status === 200) {
    const contentType = response.headers.get('Content-type')

    // 复制原始headers
    const newHeaders = new Headers(response.headers)

    // 添加新的headers
    if (contentType === 'text/html') {
      newHeaders.set('Speculation-Rules', '"/rules/prefetch.json"')
    }

    if (!newHeaders.has('Cache-Control')) {
      newHeaders.set('Cache-Control', 'public, max-age=300, s-maxage=300')
    }

    // 创建新的response
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    })
  }

  return response
}
