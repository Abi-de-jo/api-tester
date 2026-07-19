import { NextRequest, NextResponse } from 'next/server'
import { isValidUserId } from '@/lib/validate'
import { canUsePost, logRequest } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const { url, method, headers, body, user_id } = await request.json()

  if (method === 'POST') {
    if (process.env.ENABLE_POST_METHOD !== 'true') {
      return NextResponse.json({ error: 'POST disabled' }, { status: 403 })
    }
    if (!user_id || !isValidUserId(user_id)) {
      return NextResponse.json({ error: 'Invalid user_id' }, { status: 400 })
    }
    const allowed = await canUsePost(user_id)
    if (!allowed) {
      return NextResponse.json({ error: 'Access not granted' }, { status: 403 })
    }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)
  const start = Date.now()

  try {
    const finalHeaders: Record<string, string> = { ...headers }
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(method)
    if (hasBody && body && !finalHeaders['Content-Type'] && !finalHeaders['content-type']) {
      finalHeaders['Content-Type'] = 'application/json'
    }

    const res = await fetch(url, {
      method,
      headers: finalHeaders,
      body: hasBody ? body : undefined,
      signal: controller.signal,
    })

    const timeMs = Date.now() - start
    const responseText = await res.text()
    const responseHeaders: Record<string, string> = {}
    res.headers.forEach((v, k) => {
      responseHeaders[k] = v
    })

    clearTimeout(timeout)

    if (method === 'POST' && user_id) {
      void logRequest({
        user_id,
        method: 'POST',
        url,
        headers: finalHeaders,
        body,
        status: res.status,
        response_time_ms: timeMs,
      })
    }

    return NextResponse.json({
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
      body: responseText,
      timeMs,
    })
  } catch (err: any) {
    clearTimeout(timeout)
    const timeMs = Date.now() - start

    if (method === 'POST' && user_id && isValidUserId(user_id)) {
      void logRequest({
        user_id,
        method: 'POST',
        url,
        headers: headers ?? {},
        body,
        status: null,
        response_time_ms: timeMs,
      })
    }

    return NextResponse.json(
      { error: err.name === 'AbortError' ? 'Request timed out (10s)' : err.message, timeMs },
      { status: 500 }
    )
  }
}
