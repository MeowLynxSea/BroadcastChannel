import process from 'node:process'
import { provider } from 'std-env'

// 评论系统配置
export const COMMENT_CONFIG = {
  // IP 频率限制
  RATE_LIMIT: {
    WINDOW: 60 * 1000, // 1分钟窗口（毫秒）
    MAX_COMMENTS: 3, // 每分钟最多3条评论
    MAX_REPLIES: 10, // 每分钟最多10条回复
  },

  // 内容限制
  CONTENT: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 2000, // 单条评论最大长度
    MAX_DEPTH: 5, // 楼中楼最大深度
  },

  // 缓存设置
  CACHE: {
    TTL: 1000 * 60 * 30, // 30分钟
    MAX_SIZE: 100, // 最多缓存100个文章的评论
  },

  // 数据存储路径
  DATA_DIR: '.data',
  FILES: {
    SQLITE_DB: 'comments.db',
    JSON_BACKUP: 'comments-backup.json',
  },

  // 安全设置
  SECURITY: {
    // 允许的HTML标签
    ALLOWED_TAGS: ['a', 'p', 'br', 'strong', 'em', 'u', 'code', 'pre', 'blockquote'],
    // 允许的HTML属性
    ALLOWED_ATTR: ['href', 'title', 'class'],
    // 链接白名单
    ALLOWED_DOMAINS: [],
  },

  // 用户信息缓存键
  STORAGE_KEYS: {
    USER_INFO: 'blog_user_info',
    COMMENT_DRAFT: 'blog_comment_draft',
  },
}

// 获取存储适配器类型
export function getStorageAdapter() {
  const adapterProvider = process.env.SERVER_ADAPTER || provider

  // 支持原生模块的平台
  const sqliteSupported = ['node', 'vercel'].includes(adapterProvider)

  return sqliteSupported ? 'sqlite' : 'file'
}

// 获取数据库文件路径
export function getDatabasePath() {
  const { DATA_DIR, FILES } = COMMENT_CONFIG
  return `${DATA_DIR}/${FILES.SQLITE_DB}`
}
