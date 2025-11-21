import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { SEARCH_CONFIG } from '../../lib/search/config.js'
import { searchIndexCache } from '../../lib/search/index.js'

const DATA_DIR = join(process.cwd(), SEARCH_CONFIG.DATA_DIR)
const METADATA_FILE = join(DATA_DIR, SEARCH_CONFIG.FILES.METADATA)

export async function GET({ request }) {
  try {
    const url = new URL(request.url)
    const forceCheck = url.searchParams.get('force') === 'true'

    // 检查搜索索引缓存状态
    const cachedIndex = searchIndexCache.get('search-index')
    const hasCachedIndex = !!cachedIndex

    // 检查元数据文件以获取最后更新时间
    let metadata = {}
    let lastUpdateTime = 0
    try {
      const metadataData = await fs.readFile(METADATA_FILE, 'utf-8')
      metadata = JSON.parse(metadataData)
      lastUpdateTime = metadata.lastUpdateTime || 0
    }
    catch {
      // 文件不存在或无法读取
    }

    const now = Date.now()
    const timeSinceLastUpdate = now - lastUpdateTime
    const needsUpdate = timeSinceLastUpdate > SEARCH_CONFIG.UPDATE_INTERVAL

    // 判断是否正在更新（没有缓存或强制检查）
    const isUpdating = !hasCachedIndex || (forceCheck && needsUpdate)

    return new Response(JSON.stringify({
      isUpdating,
      hasCachedIndex,
      needsUpdate,
      lastUpdateTime,
      timeSinceLastUpdate,
      updateInterval: SEARCH_CONFIG.UPDATE_INTERVAL,
      timestamp: now,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
  catch {
    return new Response(JSON.stringify({
      error: 'Failed to check search status',
      timestamp: Date.now(),
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}
