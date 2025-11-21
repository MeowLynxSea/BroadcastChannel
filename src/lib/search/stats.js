import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { SEARCH_CONFIG } from './config.js'

// 获取搜索统计信息
async function getSearchStats() {
  try {
    const metadataFile = join(process.cwd(), SEARCH_CONFIG.DATA_DIR, SEARCH_CONFIG.FILES.METADATA)
    const metadataData = await fs.readFile(metadataFile, 'utf-8')
    const metadata = JSON.parse(metadataData)

    const statsFile = join(process.cwd(), SEARCH_CONFIG.DATA_DIR, 'search-stats.json')
    let stats = {}

    try {
      const statsData = await fs.readFile(statsFile, 'utf-8')
      stats = JSON.parse(statsData)
    }
    catch {
      // 统计文件不存在，使用默认值
    }

    return {
      index: metadata,
      stats: {
        totalSearches: stats.totalSearches || 0,
        lastSearchedAt: stats.lastSearchedAt || null,
        popularQueries: stats.popularQueries || [],
        averageResultsPerSearch: stats.averageResultsPerSearch || 0,
        searchErrors: stats.searchErrors || 0,
        lastUpdated: metadata.lastUpdateTime || null,
      },
    }
  }
  catch {
    return {
      index: null,
      stats: {
        totalSearches: 0,
        lastSearchedAt: null,
        popularQueries: [],
        averageResultsPerSearch: 0,
        searchErrors: 0,
        lastUpdated: null,
      },
    }
  }
}

// 记录搜索统计
async function recordSearch(query, resultCount, hasError = false) {
  try {
    const statsFile = join(process.cwd(), SEARCH_CONFIG.DATA_DIR, 'search-stats.json')
    let stats = {}

    try {
      const statsData = await fs.readFile(statsFile, 'utf-8')
      stats = JSON.parse(statsData)
    }
    catch {
      // 文件不存在，使用默认值
    }

    // 更新统计信息
    stats.totalSearches = (stats.totalSearches || 0) + 1
    stats.lastSearchedAt = new Date().toISOString()

    if (hasError) {
      stats.searchErrors = (stats.searchErrors || 0) + 1
    }
    else {
      // 更新平均结果数
      const totalResults = (stats.totalResults || 0) + resultCount
      stats.averageResultsPerSearch = Math.round(totalResults / stats.totalSearches)
    }

    // 更新热门查询
    if (query && !hasError) {
      const cleanQuery = query.toLowerCase().trim()
      stats.popularQueries = stats.popularQueries || []

      const existingQuery = stats.popularQueries.find(q => q.query === cleanQuery)
      if (existingQuery) {
        existingQuery.count++
      }
      else {
        stats.popularQueries.push({ query: cleanQuery, count: 1 })
      }

      // 按使用次数排序，保留前20个
      stats.popularQueries.sort((a, b) => b.count - a.count)
      stats.popularQueries = stats.popularQueries.slice(0, 20)
    }

    // 保存统计信息
    await fs.writeFile(statsFile, JSON.stringify(stats, null, 2))

    return stats
  }
  catch (err) {
    console.error('Error recording search stats:', err)
    return null
  }
}

// 获取搜索性能指标
async function getSearchPerformance() {
  try {
    const metadataFile = join(process.cwd(), SEARCH_CONFIG.DATA_DIR, SEARCH_CONFIG.FILES.METADATA)
    const metadataData = await fs.readFile(metadataFile, 'utf-8')
    const metadata = JSON.parse(metadataData)

    const postsFile = join(process.cwd(), SEARCH_CONFIG.DATA_DIR, SEARCH_CONFIG.FILES.POSTS)
    const postsData = await fs.readFile(postsFile, 'utf-8')
    const posts = JSON.parse(postsData)

    // 计算一些性能指标
    const now = Date.now()
    const lastUpdateTime = metadata.lastUpdateTime || 0
    const ageHours = (now - lastUpdateTime) / (1000 * 60 * 60)

    // 分析帖子大小和内容
    const totalChars = posts.reduce((sum, post) => sum + (post.text?.length || 0), 0)
    const avgCharsPerPost = posts.length > 0 ? Math.round(totalChars / posts.length) : 0

    return {
      indexAge: {
        hours: Math.round(ageHours),
        isStale: ageHours > 24, // 超过24小时认为是过期的
      },
      contentMetrics: {
        totalPosts: posts.length,
        totalChars,
        avgCharsPerPost,
      },
      updateMetrics: {
        lastUpdate: new Date(lastUpdateTime).toISOString(),
        updateDuration: metadata.updateDuration || 0,
        lastChanges: metadata.lastChanges || { added: 0, updated: 0, deleted: 0 },
      },
    }
  }
  catch {
    return {
      indexAge: { hours: 0, isStale: true },
      contentMetrics: { totalPosts: 0, totalChars: 0, avgCharsPerPost: 0 },
      updateMetrics: { lastUpdate: null, updateDuration: 0, lastChanges: { added: 0, updated: 0, deleted: 0 } },
    }
  }
}

export { getSearchPerformance, getSearchStats, recordSearch }
