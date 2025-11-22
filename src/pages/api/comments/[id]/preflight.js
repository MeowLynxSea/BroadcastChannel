import { commentSystem } from '../../../../lib/comments/index.js'

// 获取请求者IP
function getClientIP(request) {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')

  return forwarded?.split(',')[0]?.trim() || realIP || cfConnectingIP || '127.0.0.1'
}

// 获取表单数据
async function getFormData(request) {
  const formData = await request.formData()
  return {
    userName: formData.get('userName')?.trim(),
    userEmail: formData.get('userEmail')?.trim(),
    content: formData.get('content')?.trim(),
  }
}

// 设置Cookie
function setCookie(name, value, days = 30) {
  const date = new Date()
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000))
  const expires = `expires=${date.toUTCString()}`
  const maxAge = `max-age=${days * 24 * 60 * 60}`
  return `${name}=${encodeURIComponent(value)};${expires};${maxAge};path=/;SameSite=Lax;HttpOnly`
}

// POST - 预检查用户信息并设置Cookie
export async function POST({ request, params, _redirect }) {
  try {
    const postId = params.id
    const { userName, userEmail, content } = await getFormData(request)

    // 验证必填字段
    if (!userName || !userEmail) {
      return new Response('请填写所有必填字段', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      })
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
    if (!emailRegex.test(userEmail)) {
      return new Response('请输入有效的邮箱地址', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      })
    }

    // 保存用户信息到Cookie
    const userInfo = { userName, userEmail }
    const userInfoStr = JSON.stringify(userInfo)

    // 如果有内容，直接发表评论
    if (content) {
      const ip = getClientIP(request)
      const userAgent = request.headers.get('user-agent') || 'unknown'

      try {
        await commentSystem.init()
        await commentSystem.addComment(postId, {
          userName,
          userEmail,
          content,
        }, ip, userAgent)

        // 重定向回文章页面，并显示成功消息
        const successUrl = new URL(`/posts/${postId}`, request.url)
        successUrl.searchParams.set('comment-success', 'true')

        return new Response(null, {
          status: 303,
          headers: {
            'Location': successUrl.toString(),
            'Set-Cookie': setCookie('blog_user_info', userInfoStr),
          },
        })
      }
      catch (error) {
        // 重定向回文章页面，并显示错误消息
        const errorUrl = new URL(`/posts/${postId}`, request.url)
        errorUrl.searchParams.set('comment-error', encodeURIComponent(error.message || '评论提交失败'))

        return Response.redirect(errorUrl.toString(), 303)
      }
    }

    // 没有内容，只设置Cookie并重定向
    const returnTo = new URL(`/posts/${postId}`, request.url)
    return new Response(null, {
      status: 303,
      headers: {
        'Location': returnTo.toString(),
        'Set-Cookie': setCookie('blog_user_info', userInfoStr),
      },
    })
  }
  catch (error) {
    console.error('Preflight error:', error)
    return new Response('服务器错误', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    })
  }
}
