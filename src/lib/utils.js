/**
 * 获取用户头像URL
 */
export function getUserAvatar(email, size = 48) {
  // 生成基于邮箱的MD5哈希
  const crypto = require('node:crypto')
  const hash = crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex')

  // 使用Gravatar，提供默认头像
  return `https://www.gravatar.com/avatar/${hash}?d=mp&s=${size}&r=g`
}

/**
 * 格式化时间
 */
export function formatTimeAgo(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days}天前`
  }
  else if (hours > 0) {
    return `${hours}小时前`
  }
  else if (minutes > 0) {
    return `${minutes}分钟前`
  }
  else {
    return '刚刚'
  }
}
