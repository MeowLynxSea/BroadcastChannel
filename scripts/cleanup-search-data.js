#!/usr/bin/env node

/* eslint-disable eslint-comments/no-aggregating-enable */
/* eslint-disable eslint-comments/no-duplicate-disable */

import { promises as fs } from 'node:fs'
import { join } from 'node:path'

const DATA_DIR = join(process.cwd(), '.data')

async function cleanup() {
  try {
    // 检查数据目录是否存在
    await fs.access(DATA_DIR)
  }
  catch {
    // eslint-disable-next-line no-console
    console.log('Data directory does not exist, nothing to clean')
    return
  }

  try {
    // 读取目录内容
    const entries = await fs.readdir(DATA_DIR, { withFileTypes: true })
    
    let cleanedFiles = 0
    
    for (const entry of entries) {
      if (entry.isFile()) {
        const filePath = join(DATA_DIR, entry.name)
        const stats = await fs.stat(filePath)
        
        // 删除超过7天的文件
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
        
        if (stats.mtime.getTime() < sevenDaysAgo) {
          await fs.unlink(filePath)
          // eslint-disable-next-line no-console
          console.log(`Deleted old file: ${entry.name}`)
          cleanedFiles++
        }
      }
    }
    
    if (cleanedFiles === 0) {
      // eslint-disable-next-line no-console
      console.log('No old files to clean')
    } else {
      // eslint-disable-next-line no-console
      console.log(`Cleanup completed. Deleted ${cleanedFiles} old files.`)
    }
  }
  catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error during cleanup:', error)
    // eslint-disable-next-line node/prefer-global/process
    process.exit(1)
  }
}

cleanup()