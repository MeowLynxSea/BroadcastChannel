import { existsSync, promises as fs, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { COMMENT_CONFIG } from '../config.js'

/**
 * 文件存储适配器
 * 作为无服务器平台的回退方案
 */
export class FileAdapter {
  constructor() {
    this.dataPath = join(process.cwd(), COMMENT_CONFIG.DATA_DIR)
    this.commentsFile = join(this.dataPath, 'comments.json')
    this.rateLimitsFile = join(this.dataPath, 'rate-limits.json')
    this.initialized = false
    this.data = {
      comments: {},
      rateLimits: {},
    }
  }

  async init() {
    if (this.initialized)
      return

    try {
      // 确保数据目录存在
      if (!existsSync(this.dataPath)) {
        mkdirSync(this.dataPath, { recursive: true })
      }

      // 加载数据
      await this.loadData()
      this.initialized = true
    }
    catch (error) {
      console.error('Failed to initialize File adapter:', error)
      throw error
    }
  }

  async loadData() {
    try {
      // 加载评论数据
      if (existsSync(this.commentsFile)) {
        const commentsData = await fs.readFile(this.commentsFile, 'utf-8')
        this.data.comments = JSON.parse(commentsData)
      }

      // 加载频率限制数据
      if (existsSync(this.rateLimitsFile)) {
        const rateLimitsData = await fs.readFile(this.rateLimitsFile, 'utf-8')
        this.data.rateLimits = JSON.parse(rateLimitsData)
      }
    }
    catch (error) {
      console.error('Failed to load data:', error)
      // 初始化空数据
      this.data = { comments: {}, rateLimits: {} }
    }
  }

  async saveData() {
    try {
      // 并行保存文件
      await Promise.all([
        fs.writeFile(this.commentsFile, JSON.stringify(this.data.comments, null, 2)),
        fs.writeFile(this.rateLimitsFile, JSON.stringify(this.data.rateLimits, null, 2)),
      ])
    }
    catch (error) {
      console.error('Failed to save data:', error)
      throw error
    }
  }

  // 添加评论
  async addComment(postId, comment) {
    await this.init()

    if (!this.data.comments[postId]) {
      this.data.comments[postId] = {}
    }

    const now = Date.now()
    const commentData = {
      id: comment.id,
      parentId: comment.parentId || null,
      userName: comment.userName,
      userEmail: comment.userEmail,
      content: comment.content,
      contentHtml: comment.contentHtml,
      ipHash: comment.ipHash,
      userAgent: comment.userAgent,
      likes: 0,
      createdAt: now,
      updatedAt: now,
      depth: comment.depth || 0,
      path: comment.path || comment.id,
    }

    this.data.comments[postId][comment.id] = commentData
    await this.saveData()

    return commentData
  }

  // 获取文章的所有评论
  async getComments(postId, page = 1, limit = 50) {
    await this.init()

    const postComments = this.data.comments[postId] || {}
    const comments = Object.values(postComments)

    console.info('Raw comments from file for', postId, ':', comments)

    // 按路径和创建时间排序
    comments.sort((a, b) => {
      if (a.path !== b.path) {
        return a.path.localeCompare(b.path)
      }
      return a.createdAt - b.createdAt
    })

    // 应用分页
    const offset = (page - 1) * limit
    const paginatedComments = comments.slice(offset, offset + limit)

    const result = this.buildCommentTree(paginatedComments)
    console.info('Final comment tree for', postId, ':', result)

    return result
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

      if (comment.parentId && commentMap.has(comment.parentId)) {
        commentMap.get(comment.parentId).replies.push(commentNode)
      }
      else {
        rootComments.push(commentNode)
      }
    })

    return rootComments
  }

  // 检查IP频率限制
  async checkRateLimit(ipHash, isReply = false) {
    await this.init()

    const now = Date.now()
    const windowStart = now - COMMENT_CONFIG.RATE_LIMIT.WINDOW

    // 清理过期记录
    Object.keys(this.data.rateLimits).forEach((key) => {
      if (this.data.rateLimits[key].windowStart < windowStart) {
        delete this.data.rateLimits[key]
      }
    })

    // 获取当前记录
    let record = this.data.rateLimits[ipHash]

    if (!record) {
      // 创建新记录
      this.data.rateLimits[ipHash] = {
        commentCount: 0,
        replyCount: 0,
        windowStart,
        lastCommentTime: 0,
        lastReplyTime: 0,
      }
      record = this.data.rateLimits[ipHash]
    }

    const maxCount = isReply
      ? COMMENT_CONFIG.RATE_LIMIT.MAX_REPLIES
      : COMMENT_CONFIG.RATE_LIMIT.MAX_COMMENTS

    const currentCount = isReply ? record.replyCount : record.commentCount

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

  // 更新频率限制记录
  async updateRateLimit(ipHash, isReply = false) {
    await this.init()

    const now = Date.now()
    const windowStart = now - COMMENT_CONFIG.RATE_LIMIT.WINDOW

    // 确保记录存在
    if (!this.data.rateLimits[ipHash]) {
      this.data.rateLimits[ipHash] = {
        commentCount: 0,
        replyCount: 0,
        windowStart,
        lastCommentTime: 0,
        lastReplyTime: 0,
      }
    }

    const record = this.data.rateLimits[ipHash]

    if (isReply) {
      record.replyCount++
      record.lastReplyTime = now
    }
    else {
      record.commentCount++
      record.lastCommentTime = now
    }

    await this.saveData()
  }
}
