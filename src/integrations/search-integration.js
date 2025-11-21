import { getEnv } from '../lib/env.js'
import { initializeSearchIndex } from '../lib/search/index.js'

export default {
  name: 'search-index-builder',
  hooks: {
    'astro:build:start': async () => {
      // 检查是否启用了本地搜索
      // 这里我们需要创建一个模拟的 Astro 对象来获取环境变量
      const mockAstro = {
        locals: {},
        request: new Request('http://localhost:4321'),
        url: new URL('http://localhost:4321'),
      }

      const enableLocalSearch = getEnv(import.meta.env, mockAstro, 'ENABLE_LOCAL_SEARCH') === 'true'

      if (!enableLocalSearch) {
        // eslint-disable-next-line no-console
        console.log('Local search is disabled, skipping index initialization')
        return
      }

      // eslint-disable-next-line no-console
      console.log('Initializing search index...')
      try {
        await initializeSearchIndex(mockAstro)
        // eslint-disable-next-line no-console
        console.log('Search index initialized successfully')
      }
      catch (error) {
        console.error('Failed to initialize search index:', error)
      }
    },
  },
}
