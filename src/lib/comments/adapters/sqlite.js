import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { COMMENT_CONFIG, getDatabasePath } from '../config.js'

let Database
try {
  Database = require('better-sqlite3')
}
catch {
  // 如果better-sqlite3不可用，留空等待运行时处理
  console.warn('better-sqlite3 not available, will fall back to file storage')
}

/**
 * SQLite3 存储适配器
 * 仅在支持原生模块的环境中使用
 */
export class SQLiteAdapter {
  constructor() {
    this.db = null
    this.initialized = false
  }

  async init() {
    if (this.initialized)
      return

    // 检查Database是否可用
    if (!Database) {
      throw new Error('better-sqlite3 not available')
    }

    try {
      const dbPath = getDatabasePath()
      const dataDir = join(process.cwd(), COMMENT_CONFIG.DATA_DIR)

      // 确保数据目录存在
      if (!existsSync(dataDir)) {
        mkdirSync(dataDir, { recursive: true })
      }

      this.db = new Database(dbPath)
      this.createTables()
      this.initialized = true
    }
    catch (error) {
      console.error('Failed to initialize SQLite adapter:', error)
      throw error
    }
  }

  createTables() {
    // 创建评论表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        parent_id TEXT,
        user_name TEXT NOT NULL,
        user_email TEXT NOT NULL,
        content TEXT NOT NULL,
        content_html TEXT,
        ip_hash TEXT NOT NULL,
        user_agent TEXT,
        likes INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        depth INTEGER DEFAULT 0,
        path TEXT,
        FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
      )
    `)

    // 创建点赞记录表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS comment_likes (
        id TEXT PRIMARY KEY,
        comment_id TEXT NOT NULL,
        ip_hash TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
        UNIQUE(comment_id, ip_hash)
      )
    `)

    // 创建IP频率限制表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        ip_hash TEXT PRIMARY KEY,
        comment_count INTEGER DEFAULT 0,
        reply_count INTEGER DEFAULT 0,
        last_comment_time INTEGER DEFAULT 0,
        last_reply_time INTEGER DEFAULT 0,
        window_start INTEGER NOT NULL
      )
    `)

    // 创建索引
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
      CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
      CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);
      CREATE INDEX IF NOT EXISTS idx_comments_path ON comments(path);
    `)
  }

  // 添加评论
  async addComment(postId, comment) {
    if (!this.db)
      await this.init()

    const stmt = this.db.prepare(`
      INSERT INTO comments (
        id, post_id, parent_id, user_name, user_email, 
        content, content_html, ip_hash, user_agent, 
        likes, created_at, updated_at, depth, path
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const now = Date.now()
    const commentData = {
      id: comment.id,
      post_id: postId,
      parent_id: comment.parentId || null,
      user_name: comment.userName,
      user_email: comment.userEmail,
      content: comment.content,
      content_html: comment.contentHtml,
      ip_hash: comment.ipHash,
      user_agent: comment.userAgent,
      likes: 0,
      created_at: now,
      updated_at: now,
      depth: comment.depth || 0,
      path: comment.path || comment.id,
    }

    try {
      stmt.run(
        commentData.id,
        commentData.post_id,
        commentData.parent_id,
        commentData.user_name,
        commentData.user_email,
        commentData.content,
        commentData.content_html,
        commentData.ip_hash,
        commentData.user_agent,
        commentData.likes,
        commentData.created_at,
        commentData.updated_at,
        commentData.depth,
        commentData.path,
      )
      return commentData
    }
    catch (error) {
      console.error('Failed to add comment:', error)
      throw error
    }
  }

  // 获取文章的所有评论
  async getComments(postId, page = 1, limit = 50) {
    if (!this.db)
      await this.init()

    const offset = (page - 1) * limit

    const stmt = this.db.prepare(`
      SELECT 
        id, parent_id, user_name, user_email, content, content_html,
        likes, created_at, updated_at, depth, path
      FROM comments 
      WHERE post_id = ? 
      ORDER BY path ASC, created_at ASC
      LIMIT ? OFFSET ?
    `)

    const comments = stmt.all(postId, limit, offset)
    return this.buildCommentTree(comments)
  }

  // 构建评论树结构
  buildCommentTree(comments) {
    const commentMap = new Map()
    const rootComments = []

    // 创建评论映射
    comments.forEach((comment) => {
      comment.replies = []
      commentMap.set(comment.id, { ...comment })
    })

    // 构建树结构
    comments.forEach((comment) => {
      const commentNode = commentMap.get(comment.id)

      if (comment.parent_id && commentMap.has(comment.parent_id)) {
        commentMap.get(comment.parent_id).replies.push(commentNode)
      }
      else {
        rootComments.push(commentNode)
      }
    })

    return rootComments
  }

  // 点赞评论
  async likeComment(commentId, ipHash) {
    if (!this.db)
      await this.init()

    const now = Date.now()
    const likeId = `${commentId}-${ipHash}`

    try {
      // 检查是否已点赞
      const checkStmt = this.db.prepare(`
        SELECT id FROM comment_likes WHERE comment_id = ? AND ip_hash = ?
      `)
      const existing = checkStmt.get(commentId, ipHash)

      if (existing) {
        // 取消点赞
        const deleteStmt = this.db.prepare(`
          DELETE FROM comment_likes WHERE comment_id = ? AND ip_hash = ?
        `)
        deleteStmt.run(commentId, ipHash)

        const updateStmt = this.db.prepare(`
          UPDATE comments SET likes = likes - 1 WHERE id = ?
        `)
        updateStmt.run(commentId)

        return { liked: false, likes: this.getCommentLikes(commentId) }
      }
      else {
        // 添加点赞
        const insertStmt = this.db.prepare(`
          INSERT INTO comment_likes (id, comment_id, ip_hash, created_at)
          VALUES (?, ?, ?, ?)
        `)
        insertStmt.run(likeId, commentId, ipHash, now)

        const updateStmt = this.db.prepare(`
          UPDATE comments SET likes = likes + 1 WHERE id = ?
        `)
        updateStmt.run(commentId)

        return { liked: true, likes: this.getCommentLikes(commentId) }
      }
    }
    catch (error) {
      console.error('Failed to like comment:', error)
      throw error
    }
  }

  // 获取评论点赞数
  getCommentLikes(commentId) {
    if (!this.db)
      return 0

    const stmt = this.db.prepare(`
      SELECT likes FROM comments WHERE id = ?
    `)
    const result = stmt.get(commentId)
    return result ? result.likes : 0
  }

  // 检查IP频率限制
  async checkRateLimit(ipHash, isReply = false) {
    if (!this.db)
      await this.init()

    const windowStart = Date.now() - COMMENT_CONFIG.RATE_LIMIT.WINDOW

    try {
      // 清理过期记录
      this.db.prepare(`
        DELETE FROM rate_limits WHERE window_start < ?
      `).run(windowStart)

      // 获取当前记录
      const stmt = this.db.prepare(`
        SELECT * FROM rate_limits WHERE ip_hash = ?
      `)
      let record = stmt.get(ipHash)

      if (!record) {
        // 创建新记录
        const insertStmt = this.db.prepare(`
          INSERT INTO rate_limits (ip_hash, comment_count, reply_count, window_start, last_comment_time, last_reply_time)
          VALUES (?, ?, ?, ?, ?, ?)
        `)
        insertStmt.run(ipHash, 0, 0, windowStart, 0, 0)
        record = { ip_hash: ipHash, comment_count: 0, reply_count: 0 }
      }

      const maxCount = isReply
        ? COMMENT_CONFIG.RATE_LIMIT.MAX_REPLIES
        : COMMENT_CONFIG.RATE_LIMIT.MAX_COMMENTS

      const currentCount = isReply ? record.reply_count : record.comment_count

      // 检查是否超过限制
      if (currentCount >= maxCount) {
        return {
          allowed: false,
          message: isReply
            ? `回复过于频繁，请稍后再试（${COMMENT_CONFIG.RATE_LIMIT.WINDOW / 1000}秒内最多${maxCount}条）`
            : `评论过于频繁，请稍后再试（${COMMENT_CONFIG.RATE_LIMIT.WINDOW / 1000}秒内最多${maxCount}条）`,
        }
      }

      return { allowed: true }
    }
    catch (error) {
      console.error('Failed to check rate limit:', error)
      // 出错时允许通过，避免阻止正常用户
      return { allowed: true }
    }
  }

  // 更新频率限制记录
  async updateRateLimit(ipHash, isReply = false) {
    if (!this.db)
      await this.init()

    const now = Date.now()

    try {
      if (isReply) {
        this.db.prepare(`
          UPDATE rate_limits SET 
            reply_count = reply_count + 1,
            last_reply_time = ?
          WHERE ip_hash = ?
        `).run(now, ipHash)
      }
      else {
        this.db.prepare(`
          UPDATE rate_limits SET 
            comment_count = comment_count + 1,
            last_comment_time = ?
          WHERE ip_hash = ?
        `).run(now, ipHash)
      }
    }
    catch (error) {
      console.error('Failed to update rate limit:', error)
    }
  }

  // 关闭数据库连接
  close() {
    if (this.db) {
      this.db.close()
      this.db = null
      this.initialized = false
    }
  }
}
