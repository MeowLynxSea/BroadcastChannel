import crypto from 'node:crypto'
import process from 'node:process'
import sanitizeHtml from 'sanitize-html'
import { FileAdapter } from './adapters/file.js'
import { SQLiteAdapter } from './adapters/sqlite.js'
import { COMMENT_CONFIG, getStorageAdapter } from './config.js'

// 生成UUID的简单实现
function generateUUID() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
}

/**
 * 评论系统主类
 * 提供统一的评论管理接口
 */
export class CommentSystem {
  constructor() {
    this.adapter = null
    this.adapterType = null
  }

  async init() {
    if (this.adapter)
      return

    this.adapterType = getStorageAdapter()

    try {
      if (this.adapterType === 'sqlite') {
        this.adapter = new SQLiteAdapter()
      }
      else {
        this.adapter = new FileAdapter()
      }

      await this.adapter.init()
    }
    catch (error) {
      console.error(`Failed to initialize ${this.adapterType} adapter:`, error)
      // 回退到文件存储
      if (this.adapterType !== 'file') {
        this.adapterType = 'file'
        this.adapter = new FileAdapter()
        await this.adapter.init()
      }
      else {
        throw error
      }
    }
  }

  // 生成IP哈希
  hashIp(ip) {
    return crypto.createHash('sha256').update(ip + (process.env?.IP_SALT || 'default-salt')).digest('hex')
  }

  // 清理和验证评论内容
  sanitizeContent(content) {
    const config = {
      allowedTags: ['p', 'br', 'strong', 'em', 'u', 'code', 'pre', 'blockquote', 'a'],
      allowedAttributes: {
        a: ['href', 'title'],
        code: ['class'],
        pre: ['class'],
      },
      allowedSchemes: ['http', 'https', 'mailto'],
      allowedSchemesByTag: {
        a: ['http', 'https', 'mailto'],
      },
      transformTags: {
        br: { tagName: 'br' },
      },
    }

    const cleaned = sanitizeHtml(content, config)
    return cleaned.trim()
  }

  // 计算评论深度和路径
  calculateDepthAndPath(parentId, commentsMap = new Map()) {
    if (!parentId) {
      return { depth: 0, path: null }
    }

    // 这里简化处理，实际实现中需要从存储中获取父评论
    // 对于文件适配器，这需要在调用前准备好评论映射
    const parent = commentsMap.get(parentId)
    if (!parent) {
      return { depth: 0, path: null }
    }

    const depth = (parent.depth || 0) + 1
    const path = parent.path ? `${parent.path}/${parentId}` : parentId

    return { depth: Math.min(depth, COMMENT_CONFIG.CONTENT.MAX_DEPTH), path }
  }

  // 添加评论
  async addComment(postId, commentData, ip, userAgent) {
    await this.init()

    const ipHash = this.hashIp(ip)
    const isReply = !!commentData.parentId

    // 检查频率限制
    const rateLimitCheck = await this.adapter.checkRateLimit(ipHash, isReply)
    if (!rateLimitCheck.allowed) {
      throw new Error(rateLimitCheck.message)
    }

    // 验证输入
    const validation = this.validateComment(commentData)
    if (!validation.valid) {
      throw new Error(validation.message)
    }

    // 清理内容
    const sanitizedContent = this.sanitizeContent(commentData.content)

    // 获取所有评论用于计算深度（仅文件适配器需要）
    const commentsMap = new Map()
    if (this.adapterType === 'file' && commentData.parentId) {
      const allComments = await this.adapter.getComments(postId, 1, 10000)
      this.flattenComments(allComments, commentsMap)
    }

    // 计算深度和路径
    const { depth, path } = this.calculateDepthAndPath(commentData.parentId, commentsMap)

    // 创建评论对象
    const comment = {
      id: generateUUID(),
      postId,
      parentId: commentData.parentId || null,
      userName: commentData.userName.trim(),
      userEmail: commentData.userEmail.trim().toLowerCase(),
      content: sanitizedContent,
      contentHtml: sanitizedContent,
      ipHash,
      userAgent: userAgent || 'unknown',
      depth,
      path: path || generateUUID(), // 确保路径存在
    }

    try {
      // 保存评论
      const savedComment = await this.adapter.addComment(postId, comment)

      // 更新频率限制
      await this.adapter.updateRateLimit(ipHash, isReply)

      return savedComment
    }
    catch (error) {
      console.error('Failed to add comment:', error)
      throw new Error('保存评论失败，请稍后重试')
    }
  }

  // 获取评论
  async getComments(postId, page = 1, limit = 50) {
    await this.init()
    return this.adapter.getComments(postId, page, limit)
  }

  // 验证评论数据
  validateComment(data) {
    const { content, userName, userEmail } = data

    // 检查必填字段
    if (!content || !userName || !userEmail) {
      return { valid: false, message: '请填写所有必填字段' }
    }

    // 检查内容长度
    if (content.length < COMMENT_CONFIG.CONTENT.MIN_LENGTH) {
      return { valid: false, message: '评论内容不能为空' }
    }

    if (content.length > COMMENT_CONFIG.CONTENT.MAX_LENGTH) {
      return { valid: false, message: `评论内容不能超过${COMMENT_CONFIG.CONTENT.MAX_LENGTH}个字符` }
    }

    // 检查用户名长度
    if (userName.length > 50) {
      return { valid: false, message: '用户名不能超过50个字符' }
    }

    // 简单的邮箱验证
    const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
    if (!emailRegex.test(userEmail)) {
      return { valid: false, message: '请输入有效的邮箱地址' }
    }

    return { valid: true }
  }

  // 扁平化评论树（用于文件适配器）
  flattenComments(comments, map) {
    comments.forEach((comment) => {
      map.set(comment.id, comment)
      if (comment.replies && comment.replies.length > 0) {
        this.flattenComments(comment.replies, map)
      }
    })
  }

  // 获取适配器信息
  getAdapterInfo() {
    return {
      type: this.adapterType,
      initialized: !!this.adapter,
    }
  }
}

// 创建全局评论系统实例
export const commentSystem = new CommentSystem()
