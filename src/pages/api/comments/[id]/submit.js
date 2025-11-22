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

// POST - 提交评论（表单提交）
export async function POST({ request, params, _redirect }) {
  const postId = params.id
  try {
    const postId = params.id
    const ip = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // 从Cookie获取用户信息
    const cookieHeader = request.headers.get('cookie') || ''
    const userInfoCookie = cookieHeader
      .split(';')
      .find(cookie => cookie.trim().startsWith('blog_user_info='))

    if (!userInfoCookie) {
      // 用户信息丢失，重定向到预检查
      const returnTo = new URL(`/posts/${postId}`, request.url)
      returnTo.searchParams.set('comment-error', '请先填写用户信息')
      return Response.redirect(returnTo.toString(), 303)
    }

    let userInfo
    try {
      userInfo = JSON.parse(decodeURIComponent(userInfoCookie.split('=')[1]))
    }
    catch {
      const returnTo = new URL(`/posts/${postId}`, request.url)
      returnTo.searchParams.set('comment-error', '用户信息无效，请重新填写')
      return Response.redirect(returnTo.toString(), 303)
    }

    // 获取表单数据
    const { content } = await getFormData(request)

    if (!content) {
      const returnTo = new URL(`/posts/${postId}`, request.url)
      returnTo.searchParams.set('comment-error', '请输入评论内容')
      return Response.redirect(returnTo.toString(), 303)
    }

    // 提交评论
    await commentSystem.init()
    await commentSystem.addComment(postId, {
      userName: userInfo.userName,
      userEmail: userInfo.userEmail,
      content,
    }, ip, userAgent)

    // 重定向回文章页面，并显示成功消息
    const successUrl = new URL(`/posts/${postId}`, request.url)
    successUrl.searchParams.set('comment-success', 'true')
    return new Response(null, {
      status: 303,
      headers: {
        Location: successUrl.toString(),
      },
    })
  }
  catch (error) {
    console.error('Submit comment error:', error)

    // 重定向回文章页面，并显示错误消息
    const errorUrl = new URL(`/posts/${postId}`, request.url)
    errorUrl.searchParams.set('comment-error', encodeURIComponent(error.message || '评论提交失败'))
    return new Response(null, {
      status: 303,
      headers: {
        Location: errorUrl.toString(),
      },
    })
  }
}
