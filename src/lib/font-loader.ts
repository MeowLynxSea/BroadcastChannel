// Web字体加载管理
export function loadGoogleFont(fontFamily: string, display: string = 'swap'): Promise<void> {
  return new Promise((resolve, reject) => {
    // 检查字体是否已加载
    if (document.fonts && document.fonts.check(`12px "${fontFamily}"`)) {
      resolve()
      return
    }

    // 创建字体加载链接
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}&display=${display}`
    link.crossOrigin = 'anonymous'

    // 设置超时
    const timeout = setTimeout(() => {
      document.head.removeChild(link)
      reject(new Error(`Font loading timeout: ${fontFamily}`))
    }, 5000)

    // 监听加载完成
    link.onload = () => {
      clearTimeout(timeout)
      // 等待字体真正加载
      document.fonts.ready.then(() => {
        resolve()
      })
    }

    link.onerror = () => {
      clearTimeout(timeout)
      reject(new Error(`Failed to load font: ${fontFamily}`))
    }

    document.head.appendChild(link)
  })
}

// 字体回退策略
export async function setupFontFallback() {
  const fontsToTry = [
    { name: 'Inter', googleFamily: 'Inter:wght@400;500;600;700' },
    { name: 'Roboto', googleFamily: 'Roboto:wght@400;500;700' },
    { name: 'Open Sans', googleFamily: 'Open+Sans:wght@400;600;700' },
  ]

  // 尝试加载Google字体
  for (const font of fontsToTry) {
    try {
      await loadGoogleFont(font.googleFamily)

      // 如果成功，更新CSS变量
      document.documentElement.style.setProperty('--font-sans', `"${font.name}", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif`)
      console.info(`Successfully loaded Google Font: ${font.name}`)
      return
    }
    catch (error) {
      console.warn(`Failed to load ${font.name}:`, error.message)
      continue
    }
  }

  // 所有Google字体都失败，使用扩展系统字体栈
  console.info('Using extended system font stack')
  document.documentElement.style.setProperty(
    '--font-sans',
    '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Helvetica, Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
  )
}
