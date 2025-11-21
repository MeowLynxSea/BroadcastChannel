import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import Fuse from 'fuse.js'
import { LRUCache } from 'lru-cache'
import { getChannelInfo } from '../telegram/index.js'
import { SEARCH_CONFIG } from './config.js'
import { recordSearch } from './stats.js'

// 搜索索引缓存
export const searchIndexCache = new LRUCache({
  ttl: SEARCH_CONFIG.CACHE_TTL,
  maxSize: SEARCH_CONFIG.CACHE_MAX_SIZE,
  sizeCalculation: (item) => {
    return JSON.stringify(item).length
  },
})

// 请求频率控制
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = SEARCH_CONFIG.REQUEST_DELAY

// 内容存储目录
const DATA_DIR = join(process.cwd(), SEARCH_CONFIG.DATA_DIR)

const INDEX_FILE = join(DATA_DIR, SEARCH_CONFIG.FILES.INDEX)
const POSTS_FILE = join(DATA_DIR, SEARCH_CONFIG.FILES.POSTS)
const METADATA_FILE = join(DATA_DIR, SEARCH_CONFIG.FILES.METADATA)

// 确保数据目录存在
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR)
  }
  catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

// 控制请求频率
async function rateLimitRequest() {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest))
  }

  lastRequestTime = Date.now()
}

// Extract tags from content
function extractTags(content) {
  if (!content)
    return []

  // Get plain text content while preserving line breaks
  const plainText = content
    .replace(/<br\s*\/\s*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')

  // Split by lines and filter empty lines
  const lines = plainText.split('\n').filter(line => line.trim())

  // Check if last line contains tags starting with #
  if (lines.length > 0) {
    const lastLine = lines[lines.length - 1].trim()
    // Use regex to match all tags starting with #
    const tagMatches = lastLine.match(/#([^\s#]+)/g)

    if (tagMatches && tagMatches.length > 0) {
      // Remove # symbol, keep only tag name
      return tagMatches.map(tag => tag.substring(1))
    }
  }

  return []
}

// 获取所有帖子（通过分页）
async function getAllPosts(Astro, maxPages) {
  const posts = []
  let cursor = ''
  let pageCount = 0
  const seenIds = new Set()
  let consecutiveErrors = 0
  const maxPagesToFetch = maxPages || SEARCH_CONFIG.MAX_PAGES

  while (pageCount < maxPagesToFetch && consecutiveErrors < SEARCH_CONFIG.MAX_CONSECUTIVE_ERRORS) {
    await rateLimitRequest()

    try {
      // 使用已有的 getChannelInfo 函数获取帖子
      const channelInfo = await getChannelInfo(Astro, { before: cursor })
      const newPosts = channelInfo.posts || []

      // 重置错误计数
      consecutiveErrors = 0

      // 检查是否已经获取过这些帖子（避免重复）
      const uniqueNewPosts = newPosts.filter((post) => {
        if (seenIds.has(post.id)) {
          return false
        }
        seenIds.add(post.id)
        return true
      })

      if (uniqueNewPosts.length === 0) {
        break // 没有更多内容
      }

      // Process each post to extract tags and enhance search data
      const processedPosts = uniqueNewPosts.map((post) => {
        const tags = extractTags(post.content || '')
        return {
          ...post,
          tags, // Add extracted tags to the post object
          // Ensure we have a title field
          title: post.title || (post.text ? `${post.text.substring(0, 50)}...` : '无标题'),
        }
      })

      posts.push(...processedPosts)
      cursor = processedPosts[0]?.id // 使用第一篇帖子的ID作为下一页的cursor（因为是按时间正序排列的）
      pageCount++

      // 避免请求过快
      if (pageCount % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
    catch (error) {
      consecutiveErrors++

      console.error(`Error fetching posts (attempt ${consecutiveErrors}):`, error.message)

      // 如果是网络错误，等待更长时间后重试
      if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
        await new Promise(resolve => setTimeout(resolve, 5000 * consecutiveErrors))
      }

      if (consecutiveErrors >= SEARCH_CONFIG.MAX_CONSECUTIVE_ERRORS) {
        console.error('Max consecutive errors reached, stopping fetch')
        break
      }
    }
  }

  return posts // getChannelInfo 已经返回了按时间正序排列的帖子
}

// 创建搜索索引
function createSearchIndex(posts) {
  const options = {
    keys: [
      { name: 'title', weight: SEARCH_CONFIG.WEIGHTS.title },
      { name: 'text', weight: SEARCH_CONFIG.WEIGHTS.text },
      { name: 'tags', weight: SEARCH_CONFIG.WEIGHTS.tags },
    ],
    threshold: SEARCH_CONFIG.SEARCH_THRESHOLD,
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: SEARCH_CONFIG.MIN_SEARCH_LENGTH,
    ignoreLocation: true, // 添加这个选项
    findAllMatches: true, // 添加这个选项
  }

  return new Fuse(posts, options)
}

// 保存数据到文件
async function saveData(posts, fuse, metadata) {
  await ensureDataDir()

  // 获取索引数据
  let indexData = null
  if (fuse && fuse._docs) {
    // 从 Fuse 实例中提取索引数据
    const options = {
      keys: [
        { name: 'title', weight: SEARCH_CONFIG.WEIGHTS.title },
        { name: 'text', weight: SEARCH_CONFIG.WEIGHTS.text },
        { name: 'tags', weight: SEARCH_CONFIG.WEIGHTS.tags },
      ],
      threshold: SEARCH_CONFIG.SEARCH_THRESHOLD,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: SEARCH_CONFIG.MIN_SEARCH_LENGTH,
    }

    // 使用 Fuse.createIndex 创建可序列化的索引
    indexData = Fuse.createIndex(options.keys, posts)
  }

  const savePromises = [
    fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2)),
    fs.writeFile(METADATA_FILE, JSON.stringify(metadata, null, 2)),
  ]

  if (indexData) {
    savePromises.push(fs.writeFile(INDEX_FILE, JSON.stringify({
      keys: [
        { name: 'title', weight: SEARCH_CONFIG.WEIGHTS.title },
        { name: 'text', weight: SEARCH_CONFIG.WEIGHTS.text },
        { name: 'tags', weight: SEARCH_CONFIG.WEIGHTS.tags },
      ],
      items: indexData,
    }, null, 2)))
  }

  await Promise.all(savePromises)
}

// 从文件加载数据
async function loadData() {
  try {
    await ensureDataDir()

    // 检查文件是否存在
    const filesExist = await Promise.all([
      fs.access(POSTS_FILE).then(() => true).catch(() => false),
      fs.access(INDEX_FILE).then(() => true).catch(() => false),
      fs.access(METADATA_FILE).then(() => true).catch(() => false),
    ])

    if (!filesExist[0] || !filesExist[1] || !filesExist[2]) {
      return { posts: [], fuse: null, metadata: {} }
    }

    const [postsData, indexData, metadataData] = await Promise.all([
      fs.readFile(POSTS_FILE, 'utf-8'),
      fs.readFile(INDEX_FILE, 'utf-8'),
      fs.readFile(METADATA_FILE, 'utf-8'),
    ])

    const posts = JSON.parse(postsData)
    const parsedIndexData = JSON.parse(indexData)

    // 检查索引数据是否有效
    if (!parsedIndexData || !parsedIndexData.items || !Array.isArray(parsedIndexData.items)) {
      return { posts, fuse: null, metadata: JSON.parse(metadataData) }
    }

    // 使用保存的索引数据创建Fuse实例
    const options = {
      keys: parsedIndexData.keys || [
        { name: 'title', weight: SEARCH_CONFIG.WEIGHTS.title },
        { name: 'text', weight: SEARCH_CONFIG.WEIGHTS.text },
        { name: 'tags', weight: SEARCH_CONFIG.WEIGHTS.tags },
      ],
      threshold: SEARCH_CONFIG.SEARCH_THRESHOLD,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: SEARCH_CONFIG.MIN_SEARCH_LENGTH,
      ignoreLocation: true, // 添加这个选项
      findAllMatches: true, // 添加这个选项
    }

    const fuse = new Fuse(posts, options, parsedIndexData.items)
    const metadata = JSON.parse(metadataData)

    return { posts, fuse, metadata }
  }
  catch (error) {
    console.error('Error loading data:', error)
    return { posts: [], fuse: null, metadata: {} }
  }
}

// 检测内容变更
function detectChanges(oldPosts, newPosts) {
  if (!oldPosts || oldPosts.length === 0) {
    return {
      added: newPosts || [],
      updated: [],
      deleted: [],
    }
  }

  if (!newPosts || newPosts.length === 0) {
    return {
      added: [],
      updated: [],
      deleted: oldPosts,
    }
  }

  const oldPostMap = new Map(oldPosts.map(post => [post.id, post]))
  const newPostMap = new Map(newPosts.map(post => [post.id, post]))

  const added = []
  const updated = []
  const deleted = []

  // 检测新增和更新
  for (const [id, newPost] of newPostMap) {
    const oldPost = oldPostMap.get(id)

    if (!oldPost) {
      added.push(newPost)
    }
    else {
      // 比较内容是否变化
      const contentChanged = oldPost.title !== newPost.title
        || oldPost.text !== newPost.text
        || JSON.stringify(oldPost.tags || []) !== JSON.stringify(newPost.tags || [])
        || oldPost.datetime !== newPost.datetime

      if (contentChanged) {
        updated.push({ old: oldPost, new: newPost })
      }
    }
  }

  // 检测删除
  for (const [id, oldPost] of oldPostMap) {
    if (!newPostMap.has(id)) {
      deleted.push(oldPost)
    }
  }

  return { added, updated, deleted }
}

// 更新搜索索引
async function updateSearchIndex(Astro, forceUpdate = false) {
  const now = Date.now()
  const cacheKey = 'search-index'

  // 检查缓存
  if (!forceUpdate) {
    const cachedIndex = searchIndexCache.get(cacheKey)
    if (cachedIndex) {
      return cachedIndex
    }
  }

  try {
    // 加载现有数据
    const { posts: oldPosts, fuse: oldFuse, metadata } = await loadData()

    // 检查是否需要更新
    const lastUpdateTime = metadata.lastUpdateTime || 0
    const timeSinceLastUpdate = now - lastUpdateTime

    if (!forceUpdate && timeSinceLastUpdate < SEARCH_CONFIG.UPDATE_INTERVAL && oldFuse) {
      // 检查最小更新间隔
      if (timeSinceLastUpdate < SEARCH_CONFIG.MIN_UPDATE_INTERVAL) {
        const result = { posts: oldPosts, fuse: oldFuse, metadata }
        searchIndexCache.set(cacheKey, result)
        return result
      }
    }

    // eslint-disable-next-line no-console
    console.log('Updating search index...')

    // 获取最新帖子
    const newPosts = await getAllPosts(Astro)

    // 检测变更
    const changes = detectChanges(oldPosts, newPosts)

    // eslint-disable-next-line no-console
    console.log('Changes detected:', {
      added: changes.added.length,
      updated: changes.updated.length,
      deleted: changes.deleted.length,
    })

    // 创建新的搜索索引
    const newFuse = createSearchIndex(newPosts)

    // 保存新数据
    const newMetadata = {
      lastUpdateTime: now,
      totalPosts: newPosts.length,
      lastChanges: changes,
      updateDuration: Date.now() - now,
    }

    await saveData(newPosts, newFuse, newMetadata)

    // 更新缓存
    const result = { posts: newPosts, fuse: newFuse, metadata: newMetadata }
    searchIndexCache.set(cacheKey, result)

    // eslint-disable-next-line no-console
    console.log(`Search index updated successfully. Total posts: ${newPosts.length}`)

    return result
  }
  catch (error) {
    console.error('Error updating search index:', error)

    // 出错时返回现有数据（如果有）
    const { posts, fuse, metadata } = await loadData()
    return { posts: posts || [], fuse, metadata: metadata || {} }
  }
}

// 执行搜索
async function searchPosts(query, Astro, options = {}) {
  const {
    limit = SEARCH_CONFIG.DEFAULT_RESULTS_LIMIT,
    threshold = SEARCH_CONFIG.SEARCH_THRESHOLD,
    includeScore = true,
    includeMatches = true,
    recordStats = true,
  } = options

  try {
    // 验证查询参数
    if (!query || typeof query !== 'string') {
      const error = 'Invalid query'
      if (recordStats) {
        await recordSearch(query, 0, error)
      }
      return { posts: [], total: 0, error }
    }

    // 清理查询字符串
    let cleanQuery = query.trim().replace(/\s+/g, ' ')

    // 如果查询以#开头，去掉#符号（用于标签搜索）
    if (cleanQuery.startsWith('#')) {
      cleanQuery = cleanQuery.substring(1)
    }

    if (cleanQuery.length < SEARCH_CONFIG.MIN_SEARCH_LENGTH) {
      const error = 'Query too short'
      if (recordStats) {
        await recordSearch(cleanQuery, 0, error)
      }
      return { posts: [], total: 0, error }
    }

    // 确保搜索索引是最新的
    const { fuse } = await updateSearchIndex(Astro)

    if (!fuse) {
      const error = 'Search index unavailable'
      if (recordStats) {
        await recordSearch(cleanQuery, 0, error)
      }

      console.warn('Search index not available')
      return { posts: [], total: 0, error }
    }

    // 配置搜索选项
    const searchOptions = {
      threshold,
      includeScore,
      includeMatches,
      minMatchCharLength: SEARCH_CONFIG.MIN_SEARCH_LENGTH,
      ignoreLocation: true, // 忽略位置，确保全文搜索
      findAllMatches: true, // 查找所有匹配项
    }

    // 执行搜索
    const results = fuse.search(cleanQuery, searchOptions)

    // 限制结果数量
    const limitedResults = results.slice(0, Math.min(limit, SEARCH_CONFIG.MAX_RESULTS_LIMIT))

    // 返回格式化的结果
    const result = {
      posts: limitedResults.map(result => ({
        ...result.item,
        score: result.score,
        matches: result.matches,
      })),
      total: results.length,
      query: cleanQuery,
      limited: results.length > limitedResults.length,
      threshold,
      options: {
        limit,
        includeScore,
        includeMatches,
      },
    }

    // 记录搜索统计
    if (recordStats) {
      await recordSearch(cleanQuery, results.length)
    }

    return result
  }
  catch (error) {
    console.error('Error searching posts:', error)

    const errorMsg = 'Search failed'
    if (recordStats) {
      await recordSearch(query, 0, errorMsg)
    }

    return { posts: [], total: 0, error: errorMsg }
  }
}

// 初始化搜索索引（在构建时调用）
export async function initializeSearchIndex(Astro) {
  return updateSearchIndex(Astro, true) // 强制更新
}

// API 函数
export { searchPosts, updateSearchIndex }

// 导出配置和统计功能
export { SEARCH_CONFIG } from './config.js'
export { getSearchPerformance, getSearchStats } from './stats.js'
