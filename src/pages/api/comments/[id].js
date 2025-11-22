import { commentSystem } from '../../../lib/comments/index.js'

// 获取请求者IP
function getClientIP(request) {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')

  return forwarded?.split(',')[0]?.trim() || realIP || cfConnectingIP || '127.0.0.1'
}

// CORS 预检处理
function handleCORS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

// API 响应格式化
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

// GET - 获取评论
export async function GET({ request, params }) {
  try {
    const url = new URL(request.url)
    const postId = params.id
    const page = Number.parseInt(url.searchParams.get('page')) || 1
    const limit = Math.min(Number.parseInt(url.searchParams.get('limit')) || 50, 100)

    if (!postId) {
      return jsonResponse({ error: '文章ID不能为空' }, 400)
    }

    const comments = await commentSystem.getComments(postId, page, limit)

    return jsonResponse({
      success: true,
      data: comments,
      pagination: {
        page,
        limit,
        hasMore: comments.length === limit,
      },
    })
  }
  catch (error) {
    console.error('Get comments error:', error)
    return jsonResponse({ error: '获取评论失败' }, 500)
  }
}

// POST - 添加评论
export async function POST({ request, params }) {
  try {
    const postId = params.id
    const ip = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const body = await request.json()
    const { userName, userEmail, content, parentId } = body

    if (!postId) {
      return jsonResponse({ error: '文章ID不能为空' }, 400)
    }

    const comment = await commentSystem.addComment(postId, {
      userName,
      userEmail,
      content,
      parentId,
    }, ip, userAgent)

    return jsonResponse({
      success: true,
      data: comment,
    })
  }
  catch (error) {
    console.error('Add comment error:', error)
    return jsonResponse({ error: error.message || '添加评论失败' }, 400)
  }
}

// OPTIONS - CORS 预检
export async function OPTIONS() {
  return handleCORS()
}
