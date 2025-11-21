#!/usr/bin/env node

/* eslint-disable eslint-comments/no-aggregating-enable */
/* eslint-disable eslint-comments/no-duplicate-disable */

import { initializeSearchIndex } from '../src/lib/search/index.js'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'

// 读取 .env 文件
async function loadEnv() {
  const envPath = join(process.cwd(), '.env')
  const env = {}
  
  try {
    const envContent = await fs.readFile(envPath, 'utf-8')
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...values] = trimmed.split('=')
        if (key && values.length > 0) {
          env[key] = values.join('=').replace(/^["']|["']$/g, '')
        }
      }
    })
  }
  catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Could not load .env file:', error.message)
  }
  
  // 合并系统环境变量
  return { ...env, ...process.env }
}

// 初始化搜索索引
async function main() {
  // 加载环境变量
  const env = await loadEnv()
  
  // 将环境变量添加到 process.env 以便 import.meta.env 可以访问
  Object.assign(process.env, env)
  
  // 创建模拟的 Astro 对象
  const mockAstro = {
    locals: {},
    request: new Request('http://localhost:4321'),
    url: new URL('http://localhost:4321'),
    env: {
      CHANNEL: env.CHANNEL,
      TELEGRAM_HOST: env.TELEGRAM_HOST || 't.me',
      STATIC_PROXY: env.STATIC_PROXY || '',
      ENABLE_LOCAL_SEARCH: env.ENABLE_LOCAL_SEARCH || 'false',
    },
  }
  
  // 检查是否启用了本地搜索
  if (mockAstro.env.ENABLE_LOCAL_SEARCH !== 'true') {
    // eslint-disable-next-line no-console
    console.log('Local search is disabled, skipping initialization')
    // eslint-disable-next-line node/prefer-global/process
    process.exit(0)
  }
  
  // eslint-disable-next-line no-console
  console.log('Initializing search index...')
  try {
    await initializeSearchIndex(mockAstro)
    // eslint-disable-next-line no-console
    console.log('Search index initialized successfully')
  }
  catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to initialize search index:', error)
    // eslint-disable-next-line node/prefer-global/process
    process.exit(1)
  }
}

main()
