import { updateSearchIndex } from '../lib/search/index.js'

export async function onRequest(context, next) {
  // 检查是否是搜索相关的请求
  const url = new URL(context.request.url)

  if (url.pathname.startsWith('/search/') || url.pathname.startsWith('/rss.xml')) {
    // 在后台更新搜索索引（非阻塞）
    updateSearchIndex(context, false).catch((error) => {
      console.error('Error updating search index in middleware:', error)
    })
  }

  return next()
}
