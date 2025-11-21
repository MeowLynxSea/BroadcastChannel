#!/usr/bin/env node

/* eslint-disable eslint-comments/no-aggregating-enable */
/* eslint-disable eslint-comments/no-duplicate-disable */

import { getSearchStats, getSearchPerformance } from '../src/lib/search/index.js'

// 健康检查
async function healthCheck() {
  // eslint-disable-next-line no-console
  console.log('🔍 Performing search index health check...\n')

  try {
    // 获取统计信息
    const stats = await getSearchStats()
    const performance = await getSearchPerformance()
    
    // 检查索引状态
    const hasIndex = stats.index !== null
    const indexAge = performance.indexAge.hours
    const isStale = performance.indexAge.isStale
    
    // 检查内容
    const totalPosts = performance.contentMetrics.totalPosts
    const hasContent = totalPosts > 0
    
    // 输出状态
    // eslint-disable-next-line no-console
    console.log('📊 Index Status:')
    // eslint-disable-next-line no-console
    console.log(`   Index exists: ${hasIndex ? '✅' : '❌'}`)
    // eslint-disable-next-line no-console
    console.log(`   Index age: ${indexAge}h ${isStale ? '(⚠️ Stale)' : '✅'}`)
    // eslint-disable-next-line no-console
    console.log(`   Total posts: ${totalPosts} ${hasContent ? '✅' : '❌'}`)
    
    // 输出统计信息
    // eslint-disable-next-line no-console
    console.log('\n📈 Search Statistics:')
    // eslint-disable-next-line no-console
    console.log(`   Total searches: ${stats.stats.totalSearches}`)
    // eslint-disable-next-line no-console
    console.log(`   Search errors: ${stats.stats.searchErrors}`)
    // eslint-disable-next-line no-console
    console.log(`   Avg results/search: ${stats.stats.averageResultsPerSearch}`)
    
    if (stats.stats.popularQueries.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`   Top queries: ${stats.stats.popularQueries.slice(0, 3).map(q => `${q.query}(${q.count})`).join(', ')}`)
    }
    
    // 输出性能指标
    // eslint-disable-next-line no-console
    console.log('\n⚡ Performance Metrics:')
    // eslint-disable-next-line no-console
    console.log(`   Avg chars/post: ${performance.contentMetrics.avgCharsPerPost}`)
    // eslint-disable-next-line no-console
    console.log(`   Last update: ${performance.updateMetrics.lastUpdate}`)
    // eslint-disable-next-line no-console
    console.log(`   Update duration: ${performance.updateMetrics.updateDuration}ms`)
    
    const { added, updated, deleted } = performance.updateMetrics.lastChanges
    // eslint-disable-next-line no-console
    console.log(`   Last changes: +${added} ~${updated} -${deleted}`)
    
    // 健康评估
    // eslint-disable-next-line no-console
    console.log('\n🏥 Health Assessment:')
    
    let healthScore = 100
    const issues = []
    
    if (!hasIndex) {
      healthScore -= 50
      issues.push('Search index does not exist')
    }
    
    if (!hasContent) {
      healthScore -= 30
      issues.push('No content in search index')
    }
    
    if (isStale) {
      healthScore -= 20
      issues.push('Search index is stale (older than 24h)')
    }
    
    if (stats.stats.searchErrors > 0) {
      healthScore -= Math.min(20, stats.stats.searchErrors * 2)
      issues.push(`${stats.stats.searchErrors} search errors recorded`)
    }
    
    let status = '🟢 Healthy'
    if (healthScore < 50) {
      status = '🔴 Critical'
    }
    else if (healthScore < 80) {
      status = '🟡 Needs Attention'
    }
    
    // eslint-disable-next-line no-console
    console.log(`   Overall status: ${status} (${healthScore}/100)`)
    
    if (issues.length > 0) {
      // eslint-disable-next-line no-console
      console.log('   Issues found:')
      issues.forEach(issue => {
        // eslint-disable-next-line no-console
        console.log(`     ⚠️  ${issue}`)
      })
    }
    
    // 建议操作
    // eslint-disable-next-line no-console
    console.log('\n💡 Recommendations:')
    
    if (!hasIndex || !hasContent) {
      // eslint-disable-next-line no-console
      console.log('   🏃 Run "npm run init-search" to create the search index')
    }
    else if (isStale) {
      // eslint-disable-next-line no-console
      console.log('   🔄 Run "npm run update-search" to update the search index')
    }
    else {
      // eslint-disable-next-line no-console
      console.log('   ✅ Search index is healthy and up to date')
    }
    
    if (stats.stats.searchErrors > 5) {
      // eslint-disable-next-line no-console
      console.log('   🔍 Check search logs for error patterns')
    }
    
    // eslint-disable-next-line no-console
    console.log('\n🎉 Health check completed!')
    
    // 设置退出码
    // eslint-disable-next-line node/prefer-global/process
    process.exit(healthScore < 50 ? 1 : 0)
  }
  catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Health check failed:', error)
    // eslint-disable-next-line node/prefer-global/process
    process.exit(1)
  }
}

healthCheck()