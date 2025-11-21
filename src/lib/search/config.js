// 本地搜索配置
export const SEARCH_CONFIG = {
  // 请求频率控制
  REQUEST_DELAY: 1000, // 1秒
  MAX_PAGES: 50, // 最大抓取页数
  MAX_CONSECUTIVE_ERRORS: 3, // 最大连续错误次数
  REQUEST_TIMEOUT: 15000, // 请求超时时间（毫秒）

  // 缓存设置
  CACHE_TTL: 1000 * 60 * 30, // 30分钟
  CACHE_MAX_SIZE: 10 * 1024 * 1024, // 10MB

  // 索引更新
  UPDATE_INTERVAL: 1000 * 60 * 60, // 1小时
  MIN_UPDATE_INTERVAL: 1000 * 60 * 5, // 最小5分钟间隔

  // 搜索配置
  SEARCH_THRESHOLD: 0.3, // 搜索阈值
  MIN_SEARCH_LENGTH: 2, // 最小搜索长度
  DEFAULT_RESULTS_LIMIT: 50, // 默认结果限制
  MAX_RESULTS_LIMIT: 200, // 最大结果限制

  // 内容权重
  WEIGHTS: {
    title: 0.3,
    text: 0.5,
    tags: 0.2,
  },

  // 清理设置
  CLEANUP_DAYS: 7, // 保留天数

  // 文件路径
  DATA_DIR: '.data',
  FILES: {
    INDEX: 'search-index.json',
    POSTS: 'posts.json',
    METADATA: 'metadata.json',
  },

  // 用户代理
  USER_AGENT: 'Mozilla/5.0 (compatible; Bot)',

  // 错误重试
  RETRY_COUNT: 2,
  RETRY_DELAY: 3000, // 3秒
}
